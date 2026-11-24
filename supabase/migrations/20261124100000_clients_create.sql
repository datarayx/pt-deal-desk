-- Task 2.4 — Clients list and New Client.
-- 1. v_client_list: one row per client for the list page. BVN/NIN are MASKED here
--    (*******1234, SECURITY.md) so full numbers never reach list pages or exports.
-- 2. create_client(jsonb): the whole New Client flow in one transaction — client, individual or
--    company profile, directors (reusing a person already on file by BVN/NIN), the KYC checklist
--    with any uploaded files, the KYC status and an audit entry. SECURITY INVOKER + assert_role:
--    RLS (CEO only) applies to every write.

create view public.v_client_list with (security_invoker = true) as
select
  c.id,
  c.client_type,
  c.display_name,
  c.sector,
  c.kyc_status,
  c.enquiry_source,
  c.created_at,
  c.referrer_id,
  r.name as referrer_name,
  coalesce(ip.phone, cp.contact_phone) as phone,
  coalesce(ip.email, cp.contact_email) as email,
  cp.rc_number,
  cp.company_type,
  case when ip.bvn is null then null else repeat('*', 7) || right(ip.bvn, 4) end as bvn_masked,
  case when ip.nin is null then null else repeat('*', 7) || right(ip.nin, 4) end as nin_masked,
  coalesce(dir.n, 0) as director_count,
  coalesce(docs.required, 0) as required_docs,
  coalesce(docs.received, 0) as received_docs,
  cc.bureau as latest_bureau,
  cc.rating as latest_rating,
  cc.check_date as latest_check_date,
  coalesce(dl.active, 0) as active_deals,
  coalesce(dl.total, 0) as deal_count,
  coalesce(bal.outstanding, 0)::numeric(18, 2)::text as outstanding
from public.clients c
left join public.referrers r on r.id = c.referrer_id
left join public.individual_profiles ip on ip.client_id = c.id
left join public.company_profiles cp on cp.client_id = c.id
left join lateral (
  select count(*)::int as n from public.company_directors d where d.company_client_id = c.id
) dir on true
left join lateral (
  select
    count(*) filter (where t.is_required)::int as required,
    count(*) filter (where t.is_required and cd.status in ('received', 'verified'))::int as received
  from public.client_documents cd
  join public.kyc_document_types t on t.id = cd.document_type_id
  where cd.client_id = c.id
) docs on true
left join lateral (
  select k.bureau, k.rating, k.check_date
  from public.credit_checks k
  where k.client_id = c.id
  order by k.check_date desc, k.created_at desc
  limit 1
) cc on true
left join lateral (
  select
    count(*) filter (where d.outcome in ('open', 'negotiating'))::int as active,
    count(*)::int as total
  from public.deals d
  where d.client_id = c.id
) dl on true
left join lateral (
  -- Unpaid instalment balances (confirmed payments only) across the client's deals
  select sum(s.total_due - coalesce(paid.amount, 0)) as outstanding
  from public.repayment_schedules s
  join public.deals d on d.id = s.deal_id
  left join lateral (
    select sum(rr.amount) as amount
    from public.repayment_reports rr
    where rr.schedule_id = s.id and rr.confirmed_by_financier
  ) paid on true
  where d.client_id = c.id
) bal on true;

comment on view public.v_client_list is 'Clients list: contact, masked BVN/NIN, KYC document progress, latest credit rating, active deals, outstanding (text).';
revoke all on public.v_client_list from anon;
revoke all on public.v_client_list from authenticated;
grant select on public.v_client_list to authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Keep only allowed keys; "" becomes null (forms send blanks as empty strings).
create or replace function public.jsonb_pick(p jsonb, p_keys text[])
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    jsonb_object_agg(e.key, case when e.value = '""'::jsonb then 'null'::jsonb else e.value end),
    '{}'::jsonb)
  from jsonb_each(coalesce(p, '{}'::jsonb)) e
  where e.key = any (p_keys)
$$;
revoke all on function public.jsonb_pick(jsonb, text[]) from public, anon;
grant execute on function public.jsonb_pick(jsonb, text[]) to authenticated;

-- Save one person (individual client or company director). A person already on file with the
-- same BVN or NIN is reused (one record per real person). p_mode:
--   'client'   → this person IS the client: link client_id, newer details overwrite older ones
--   'director' → keep what's on file, only fill blanks
create or replace function public.kyc_save_person(p jsonb, p_client_id uuid, p_mode text)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_keys constant text[] := array['title', 'first_name', 'middle_name', 'last_name', 'gender',
    'date_of_birth', 'phone', 'email', 'residential_address', 'state', 'lga', 'occupation',
    'employer_or_business', 'monthly_income_range', 'bvn', 'nin', 'id_type', 'id_number',
    'id_expiry', 'next_of_kin_name', 'next_of_kin_phone', 'next_of_kin_relationship', 'is_pep'];
  v_new jsonb := public.jsonb_pick(p, v_keys);
  v_bvn text := nullif(btrim(v_new ->> 'bvn'), '');
  v_nin text := nullif(btrim(v_new ->> 'nin'), '');
  v_given uuid := nullif(p ->> 'id', '')::uuid;
  v_matches uuid[];
  v_existing public.individual_profiles;
  v_merged jsonb;
  v_id uuid;
begin
  if p_mode not in ('client', 'director') then
    raise exception 'Unknown person mode %', p_mode using errcode = '22023';
  end if;

  select array_agg(distinct ip.id) into v_matches
  from public.individual_profiles ip
  where (v_bvn is not null and ip.bvn = v_bvn) or (v_nin is not null and ip.nin = v_nin);

  if coalesce(array_length(v_matches, 1), 0) > 1 then
    raise exception 'The BVN and NIN given for % % belong to two different people on file',
      v_new ->> 'first_name', v_new ->> 'last_name' using errcode = '23505';
  end if;

  if coalesce(array_length(v_matches, 1), 0) = 1 then
    select * into v_existing from public.individual_profiles where id = v_matches[1];
    if p_mode = 'client' and v_existing.client_id is not null then
      raise exception 'This person (BVN/NIN on file) is already a client' using errcode = '23505';
    end if;
    v_merged := case p_mode
      when 'client' then to_jsonb(v_existing) || jsonb_strip_nulls(v_new)
      else to_jsonb(v_existing) || jsonb_strip_nulls(v_new) || jsonb_strip_nulls(to_jsonb(v_existing))
    end;
    update public.individual_profiles t
       set (title, first_name, middle_name, last_name, gender, date_of_birth, phone, email,
            residential_address, state, lga, occupation, employer_or_business, monthly_income_range,
            bvn, nin, id_type, id_number, id_expiry, next_of_kin_name, next_of_kin_phone,
            next_of_kin_relationship, is_pep)
         = (r.title, r.first_name, r.middle_name, r.last_name, r.gender, r.date_of_birth, r.phone,
            r.email, r.residential_address, r.state, r.lga, r.occupation, r.employer_or_business,
            r.monthly_income_range, r.bvn, r.nin, r.id_type, r.id_number, r.id_expiry,
            r.next_of_kin_name, r.next_of_kin_phone, r.next_of_kin_relationship,
            coalesce(r.is_pep, false)),
           client_id = case when p_mode = 'client' then p_client_id else t.client_id end,
           consent_given_at = coalesce(t.consent_given_at, now())
      from jsonb_populate_record(null::public.individual_profiles, v_merged) r
     where t.id = v_existing.id;
    return v_existing.id;
  end if;

  v_id := coalesce(v_given, gen_random_uuid());
  insert into public.individual_profiles (
    id, client_id, title, first_name, middle_name, last_name, gender, date_of_birth, phone, email,
    residential_address, state, lga, occupation, employer_or_business, monthly_income_range,
    bvn, nin, id_type, id_number, id_expiry, next_of_kin_name, next_of_kin_phone,
    next_of_kin_relationship, is_pep, consent_given_at)
  select v_id, case when p_mode = 'client' then p_client_id end,
    r.title, r.first_name, r.middle_name, r.last_name, r.gender, r.date_of_birth, r.phone, r.email,
    r.residential_address, r.state, r.lga, r.occupation, r.employer_or_business,
    r.monthly_income_range, r.bvn, r.nin, r.id_type, r.id_number, r.id_expiry, r.next_of_kin_name,
    r.next_of_kin_phone, r.next_of_kin_relationship, coalesce(r.is_pep, false), now()
  from jsonb_populate_record(null::public.individual_profiles, v_new) r;
  return v_id;
end
$$;
comment on function public.kyc_save_person(jsonb, uuid, text) is 'Insert a person, or reuse the one already on file with the same BVN/NIN.';
revoke all on function public.kyc_save_person(jsonb, uuid, text) from public, anon;
grant execute on function public.kyc_save_person(jsonb, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- create_client
-- Payload:
-- { id, client_type, enquiry_source, referrer_id, sector, notes, consent: true,
--   individual: { id?, <person fields> },                     -- individual clients
--   company: { <company fields> },                            -- company clients
--   directors: [ { profile: { id?, <person fields> }, role, shareholding_pct } ],
--   documents: [ { document_type_id, person_id (null = the client itself), file_path, expiry_date } ] }
-- person_id for a director is the profile id sent in directors[].profile.id; files must already
-- be uploaded to the kyc bucket under "<client id>/".
-- ---------------------------------------------------------------------------
create or replace function public.create_client(p jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_type public.client_type := (p ->> 'client_type')::public.client_type;
  v_company jsonb;
  v_display text;
  v_dir jsonb;
  v_doc jsonb;
  v_person uuid;
  v_sent_id uuid;
  v_alias jsonb := '{}'::jsonb;       -- profile id sent by the form → id actually used
  v_directors uuid[] := '{}';
  v_pct numeric;
  v_total_pct numeric := 0;
  v_role public.director_role;
  v_type_row public.kyc_document_types;
  v_path text;
  v_expiry date;
  v_missing integer;
  v_status public.kyc_status;
  v_received integer;
begin
  perform public.assert_role('ceo');
  if v_id is null or v_type is null then
    raise exception 'Client id and type are required' using errcode = '22023';
  end if;
  if coalesce((p ->> 'consent')::boolean, false) is not true then
    raise exception 'Record the client''s consent to process their data before saving' using errcode = '22023';
  end if;

  -- 1. The client row (display name filled in below)
  insert into public.clients (id, client_type, display_name, sector, enquiry_source, referrer_id, notes)
  values (
    v_id, v_type, 'New client',
    nullif(btrim(p ->> 'sector'), ''),
    (p ->> 'enquiry_source')::public.enquiry_source,
    nullif(p ->> 'referrer_id', '')::uuid,
    nullif(btrim(p ->> 'notes'), ''));

  -- 2. Profile
  if v_type = 'individual' then
    v_person := public.kyc_save_person(p -> 'individual', v_id, 'client');
    select concat_ws(' ', ip.first_name, ip.last_name) into v_display
    from public.individual_profiles ip where ip.id = v_person;
    v_alias := v_alias || jsonb_build_object(coalesce(p -> 'individual' ->> 'id', 'self'), v_person);
  else
    v_company := public.jsonb_pick(p -> 'company', array['registered_name', 'rc_number',
      'incorporation_date', 'company_type', 'registered_address', 'operating_address', 'tin',
      'sector', 'annual_turnover_range', 'website', 'contact_person', 'contact_phone', 'contact_email']);
    insert into public.company_profiles (
      client_id, registered_name, rc_number, incorporation_date, company_type, registered_address,
      operating_address, tin, sector, annual_turnover_range, website, contact_person, contact_phone,
      contact_email)
    select v_id, r.registered_name, r.rc_number, r.incorporation_date, r.company_type,
      r.registered_address, r.operating_address, r.tin, r.sector, r.annual_turnover_range, r.website,
      r.contact_person, r.contact_phone, r.contact_email
    from jsonb_populate_record(null::public.company_profiles, v_company) r;
    v_display := v_company ->> 'registered_name';

    -- 3. Directors and shareholders
    if jsonb_array_length(coalesce(p -> 'directors', '[]'::jsonb)) = 0 then
      raise exception 'Add at least one director' using errcode = '22023';
    end if;
    if jsonb_array_length(p -> 'directors') > 50 then
      raise exception 'Too many directors' using errcode = '22023';
    end if;
    for v_dir in select value from jsonb_array_elements(p -> 'directors') loop
      v_role := (v_dir ->> 'role')::public.director_role;
      v_pct := nullif(v_dir ->> 'shareholding_pct', '')::numeric;
      v_total_pct := v_total_pct + coalesce(v_pct, 0);
      v_person := public.kyc_save_person(v_dir -> 'profile', null, 'director');
      if v_person = any (v_directors) then
        raise exception 'The same person is listed twice as a director' using errcode = '23505';
      end if;
      v_directors := array_append(v_directors, v_person);
      v_sent_id := nullif(v_dir -> 'profile' ->> 'id', '')::uuid;
      if v_sent_id is not null then
        v_alias := v_alias || jsonb_build_object(v_sent_id::text, v_person);
      end if;
      insert into public.company_directors (company_client_id, individual_profile_id, role, shareholding_pct)
      values (v_id, v_person, v_role, v_pct);
    end loop;
    if v_total_pct > 100 then
      raise exception 'Shareholdings add up to % per cent, which is more than 100', v_total_pct
        using errcode = '22023';
    end if;
  end if;

  update public.clients set display_name = coalesce(nullif(btrim(v_display), ''), 'Unnamed client')
  where id = v_id;

  -- 4. KYC checklist: one row per item for the client, plus the individual list per director.
  --    Items without a file are recorded as missing so deficiencies show from day one.
  insert into public.client_documents (client_id, individual_profile_id, document_type_id, status)
  select v_id, null, t.id, 'missing' from public.kyc_document_types t where t.client_type = v_type;
  insert into public.client_documents (client_id, individual_profile_id, document_type_id, status)
  select v_id, d, t.id, 'missing'
  from unnest(v_directors) d
  cross join public.kyc_document_types t
  where t.client_type = 'individual';

  for v_doc in select value from jsonb_array_elements(coalesce(p -> 'documents', '[]'::jsonb)) loop
    v_path := nullif(v_doc ->> 'file_path', '');
    continue when v_path is null;
    if v_path not like v_id::text || '/%' or v_path !~ '^[A-Za-z0-9/_.\-]+$' then
      raise exception 'Document file path is outside this client''s folder' using errcode = '22023';
    end if;
    if not exists (select 1 from storage.objects o where o.bucket_id = 'kyc' and o.name = v_path) then
      raise exception 'An uploaded document was not found; upload it again' using errcode = '22023';
    end if;
    select * into v_type_row from public.kyc_document_types where id = (v_doc ->> 'document_type_id')::uuid;
    if not found then
      raise exception 'Unknown document type' using errcode = '22023';
    end if;
    v_sent_id := nullif(v_doc ->> 'person_id', '')::uuid;
    v_person := case when v_sent_id is null then null else (v_alias ->> v_sent_id::text)::uuid end;
    if v_sent_id is not null and v_person is null then
      raise exception 'A document belongs to a director who is not on this client' using errcode = '22023';
    end if;
    if (v_person is null and v_type_row.client_type <> v_type)
       or (v_person is not null and v_type_row.client_type <> 'individual') then
      raise exception 'Document "%" doesn''t belong on this checklist', v_type_row.name using errcode = '22023';
    end if;
    -- An individual client's own documents sit at client level (individual_profile_id null)
    if v_type = 'individual' then v_person := null; end if;
    v_expiry := case when v_type_row.has_expiry then nullif(v_doc ->> 'expiry_date', '')::date end;

    update public.client_documents cd
       set file_path = v_path,
           expiry_date = v_expiry,
           status = case when v_expiry is not null and v_expiry < public.lagos_today()
                         then 'expired' else 'received' end::public.document_status
     where cd.client_id = v_id
       and cd.individual_profile_id is not distinct from v_person
       and cd.document_type_id = v_type_row.id;
  end loop;

  -- 5. KYC status: submitted once every required item has a current file
  select
    count(*) filter (where t.is_required and cd.status in ('missing', 'expired')),
    count(*) filter (where cd.status = 'received')
  into v_missing, v_received
  from public.client_documents cd
  join public.kyc_document_types t on t.id = cd.document_type_id
  where cd.client_id = v_id;
  v_status := case when v_missing = 0 then 'submitted' else 'incomplete' end;
  update public.clients set kyc_status = v_status where id = v_id;

  -- 6. Audit (no BVN/NIN in the log)
  insert into public.audit_log (action, entity_type, entity_id, after)
  values ('create', 'client', v_id, jsonb_build_object(
    'client_type', v_type,
    'display_name', v_display,
    'directors', coalesce(array_length(v_directors, 1), 0),
    'documents_received', v_received,
    'kyc_status', v_status));

  return v_id;
end
$$;
comment on function public.create_client(jsonb) is 'New Client flow in one transaction: client, profile, directors, KYC checklist, status, audit.';
revoke all on function public.create_client(jsonb) from public, anon;
grant execute on function public.create_client(jsonb) to authenticated;
