-- Task 2.1 — database support for the Settings area.
--
-- 1. Workflow stages get a fixed system_key. The CEO may rename, recolour and reorder every stage,
--    but the five the workflow depends on (Enquiry, Approved, Disbursed, Repaying, Completed) can't
--    be deleted or lose their key, and the money functions now find them by key, not by name.
-- 2. Private `branding` bucket for the company logo (letterhead on exported reports): the CEO
--    manages it; CEO and accountant can read it. Storage policies restructured to one per action.
-- 3. sign_out_everywhere(user): CEO ends all of a user's sessions (SECURITY.md).
-- 4. Default fee settings.

-- ---------------------------------------------------------------------------
-- 1. Stage keys
-- ---------------------------------------------------------------------------
alter table public.deal_stages
  add column system_key text unique check (system_key in ('enquiry', 'approved', 'disbursed', 'repaying', 'completed'));

update public.deal_stages set system_key = 'enquiry' where name = 'Enquiry';
update public.deal_stages set system_key = 'approved' where name = 'Approved';
update public.deal_stages set system_key = 'disbursed' where name = 'Disbursed';
update public.deal_stages set system_key = 'repaying' where name = 'Repaying';
update public.deal_stages set system_key = 'completed' where name = 'Completed';

comment on column public.deal_stages.system_key is 'Set on the five stages the workflow relies on; those can be renamed but not deleted.';

create or replace function public.deal_stages_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.system_key is not null then
      raise exception 'The % stage is part of the deal workflow and cannot be deleted. You can rename it.', old.name
        using errcode = '42501';
    end if;
    return old;
  end if;
  if old.system_key is distinct from new.system_key then
    raise exception 'A stage''s workflow role cannot be changed' using errcode = '42501';
  end if;
  if new.system_key = 'completed' and not new.is_terminal then
    raise exception 'The completed stage must stay terminal' using errcode = '23514';
  end if;
  if new.system_key in ('enquiry', 'approved', 'disbursed', 'repaying') and new.is_terminal then
    raise exception 'The % stage cannot be terminal', new.name using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger deal_stages_guard before update or delete on public.deal_stages
  for each row execute function public.deal_stages_guard();

create or replace function public.stage_name(p_key text)
returns text
language sql
stable
set search_path = ''
as $$ select name from public.deal_stages where system_key = p_key $$;
revoke all on function public.stage_name(text) from public, anon;
grant execute on function public.stage_name(text) to authenticated;

-- disburse_deal: move to the 'disbursed' stage by key
create or replace function public.disburse_deal(
  p_deal_id uuid,
  p_amount numeric,
  p_disbursed_on date,
  p_first_repayment_date date,
  p_frequency public.repayment_frequency,
  p_at timestamptz default null
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  d public.deals%rowtype;
  v_fee uuid;
  v_instalments integer;
begin
  perform public.assert_role('ceo');
  select * into d from public.deals where id = p_deal_id for update;
  if not found then raise exception 'Deal not found' using errcode = 'P0002'; end if;
  if d.disbursement_date is not null then
    raise exception 'Deal % is already disbursed', d.reference using errcode = '22023';
  end if;
  if d.outcome not in ('open', 'negotiating') then
    raise exception 'Deal % is %, not open', d.reference, d.outcome using errcode = '22023';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Disbursed amount must be greater than zero' using errcode = '22023';
  end if;

  update public.deals
  set amount_disbursed = round(p_amount, 2),
      disbursement_date = p_disbursed_on,
      first_repayment_date = p_first_repayment_date,
      repayment_frequency = p_frequency,
      outcome = 'open'
  where id = p_deal_id;

  v_instalments := public.generate_repayment_schedule(p_deal_id);
  perform public.move_deal_stage(p_deal_id, public.stage_name('disbursed'), null,
                                 coalesce(p_at, public.lagos_noon(p_disbursed_on)));

  for v_fee in select id from public.deal_fees
               where deal_id = p_deal_id and status = 'pending' and trigger = 'on_disbursement' loop
    perform public.recognise_fee(v_fee, p_disbursed_on);
  end loop;
  return v_instalments;
end;
$$;

-- confirm_repayment_report: compare and move stages by key
create or replace function public.confirm_repayment_report(
  p_report_id uuid,
  p_confirmed_at timestamptz default null,
  p_note text default null
)
returns public.instalment_status
language plpgsql
set search_path = ''
as $$
declare
  r public.repayment_reports%rowtype;
  v_deal uuid;
  v_stage_key text;
  v_at timestamptz := coalesce(p_confirmed_at, now());
  v_status public.instalment_status;
  v_confirmed_count integer;
  v_fee uuid;
begin
  perform public.assert_role('ceo');
  select * into r from public.repayment_reports where id = p_report_id for update;
  if not found then raise exception 'Repayment report not found' using errcode = 'P0002'; end if;
  if r.confirmed_by_financier then
    return (select status from public.repayment_schedules where id = r.schedule_id);
  end if;

  update public.repayment_reports
  set confirmed_by_financier = true, confirmed_at = v_at, confirmation_note = p_note
  where id = p_report_id;
  v_status := public.refresh_schedule_status(r.schedule_id);

  select s.deal_id, st.system_key into v_deal, v_stage_key
  from public.repayment_schedules s
  join public.deals d on d.id = s.deal_id
  join public.deal_stages st on st.id = d.stage_id
  where s.id = r.schedule_id;

  select count(*) into v_confirmed_count
  from public.repayment_reports rr join public.repayment_schedules ss on ss.id = rr.schedule_id
  where ss.deal_id = v_deal and rr.confirmed_by_financier;

  if v_confirmed_count = 1 then
    for v_fee in select id from public.deal_fees
                 where deal_id = v_deal and status = 'pending' and trigger = 'on_first_repayment' loop
      perform public.recognise_fee(v_fee, (v_at at time zone 'Africa/Lagos')::date);
    end loop;
    if v_stage_key = 'disbursed' then
      perform public.move_deal_stage(v_deal, public.stage_name('repaying'), 'First repayment confirmed', v_at);
    end if;
  end if;

  if not exists (select 1 from public.repayment_schedules where deal_id = v_deal and status <> 'confirmed') then
    perform public.move_deal_stage(v_deal, public.stage_name('completed'), 'All instalments confirmed', v_at);
    update public.deals set outcome = 'completed' where id = v_deal;
  end if;
  return v_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Branding bucket + storage policies (one per action)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('branding', 'branding', false, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy "pt private buckets: ceo all" on storage.objects;

create policy "pt buckets: read" on storage.objects for select to authenticated
  using (
    (bucket_id in ('kyc', 'credit-reports', 'deal-docs', 'repayment-proofs') and (select public.auth_role()) = 'ceo')
    or (bucket_id = 'branding' and (select public.auth_role()) in ('ceo', 'accountant'))
  );
create policy "pt buckets: ceo uploads" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('kyc', 'credit-reports', 'deal-docs', 'repayment-proofs', 'branding')
    and (select public.auth_role()) = 'ceo'
  );
create policy "pt buckets: ceo updates" on storage.objects for update to authenticated
  using (
    bucket_id in ('kyc', 'credit-reports', 'deal-docs', 'repayment-proofs', 'branding')
    and (select public.auth_role()) = 'ceo'
  )
  with check (
    bucket_id in ('kyc', 'credit-reports', 'deal-docs', 'repayment-proofs', 'branding')
    and (select public.auth_role()) = 'ceo'
  );
create policy "pt buckets: ceo deletes" on storage.objects for delete to authenticated
  using (
    bucket_id in ('kyc', 'credit-reports', 'deal-docs', 'repayment-proofs', 'branding')
    and (select public.auth_role()) = 'ceo'
  );

-- ---------------------------------------------------------------------------
-- 3. Sign out everywhere (ends every session of a user; their current access token stays valid
--    until it expires, at most one hour)
-- ---------------------------------------------------------------------------
create or replace function public.sign_out_everywhere(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  perform public.assert_role('ceo');
  delete from auth.sessions where user_id = p_user_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.sign_out_everywhere(uuid) from public, anon;
grant execute on function public.sign_out_everywhere(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Default fee settings (percent values; the deal form pre-fills from these)
-- ---------------------------------------------------------------------------
insert into public.settings (key, value) values
  ('fee_defaults', '{"client_fee_pct": 1.5, "provider_commission_pct": 1.0, "collateral_fee": {"basis": "percent", "value": 0.5}}')
on conflict (key) do nothing;
