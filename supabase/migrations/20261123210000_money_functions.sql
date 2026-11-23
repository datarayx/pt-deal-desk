-- Money logic (DECISIONS.md: "Money logic … lives in Postgres functions called by Server Actions,
-- the seed and pg_cron"). These are THE functions the app will call; the demo seed uses them too,
-- so seeded books are produced exactly as real ones will be.
--
--   post_journal / reverse_journal     balanced journals (checked up front, and again at commit)
--   move_deal_stage                    stage change + history + timeline entry
--   generate_repayment_schedule        flat interest; monthly / quarterly / bullet (WORKFLOWS §3)
--   disburse_deal                      disbursement → schedule → disbursement-triggered fees
--   report_repayment                   client-reported payment, allocated oldest instalment first
--   confirm_repayment_report           financier confirmation → statuses, first-repayment fees,
--                                      Disbursed → Repaying → Completed
--   recognise_fee                      fee + VAT journal (WORKFLOWS §4), idempotent
--   record_fee_receipt                 Dr Bank / Dr WHT receivable / Cr Fees receivable
--   pay_referral_fee                   Dr Referral fees payable / Cr Bank
--   refresh_schedule_status / refresh_all_instalment_statuses
--
-- Role rules (SECURITY.md): deal/repayment/fee-recognition functions are CEO only and run with
-- the caller's rights (RLS applies). Receipt/payment functions are SECURITY DEFINER because the
-- accountant may change fee status only through them. Every function re-checks the role; direct
-- admin connections (session user postgres, no JWT) and the service role are allowed for the seed
-- and scheduled jobs.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.assert_role(variadic allowed public.app_role[])
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if session_user = 'postgres' and auth.uid() is null then
    return; -- direct admin connection (migrations, seed, scheduled jobs)
  end if;
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return;
  end if;
  if public.auth_role() = any (allowed) then
    return;
  end if;
  raise exception 'You do not have permission to do this' using errcode = '42501';
end;
$$;

create or replace function public.lagos_today()
returns date
language sql
stable
set search_path = ''
as $$ select (now() at time zone 'Africa/Lagos')::date $$;

create or replace function public.lagos_noon(p_day date)
returns timestamptz
language sql
immutable
set search_path = ''
as $$ select (p_day + time '12:00') at time zone 'Africa/Lagos' $$;

-- Numeric setting (e.g. vat_rate_pct). SECURITY DEFINER so any signed-in role can read rates.
create or replace function public.setting_numeric(p_key text, p_default numeric)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select (s.value #>> '{}')::numeric from public.settings s where s.key = p_key), p_default)
$$;

-- ---------------------------------------------------------------------------
-- Journals
-- ---------------------------------------------------------------------------
-- p_lines: [{"account": "1000", "debit": "1250.00"} | {"account": "4100", "credit": 1250, "description": "…"}]
create or replace function public.post_journal(
  p_entry_date date,
  p_memo text,
  p_lines jsonb,
  p_source public.journal_source default 'manual',
  p_source_id uuid default null,
  p_reference text default null,
  p_reverses_entry_id uuid default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_entry uuid;
  v_line jsonb;
  v_account uuid;
  v_debit numeric;
  v_credit numeric;
  v_total_debit numeric := 0;
  v_total_credit numeric := 0;
begin
  perform public.assert_role('ceo', 'accountant');

  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 2 then
    raise exception 'A journal needs at least two lines' using errcode = '22023';
  end if;

  -- Check balance up front so the caller gets a clear error now, not at commit
  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_debit := round(coalesce((v_line ->> 'debit')::numeric, 0), 2);
    v_credit := round(coalesce((v_line ->> 'credit')::numeric, 0), 2);
    if not ((v_debit > 0 and v_credit = 0) or (v_credit > 0 and v_debit = 0)) then
      raise exception 'Each line needs either a debit or a credit greater than zero' using errcode = '22023';
    end if;
    v_total_debit := v_total_debit + v_debit;
    v_total_credit := v_total_credit + v_credit;
  end loop;
  if v_total_debit <> v_total_credit then
    raise exception 'Journal does not balance: debits % vs credits %', v_total_debit, v_total_credit
      using errcode = '23514';
  end if;

  insert into public.journal_entries (entry_date, memo, source, source_id, reference, reverses_entry_id)
  values (p_entry_date, p_memo, p_source, p_source_id, p_reference, p_reverses_entry_id)
  returning id into v_entry;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    select id into v_account from public.accounts where code = v_line ->> 'account' and is_active;
    if v_account is null then
      raise exception 'Unknown or inactive account %', v_line ->> 'account' using errcode = '22023';
    end if;
    insert into public.journal_lines (entry_id, account_id, debit, credit, description)
    values (
      v_entry, v_account,
      round(coalesce((v_line ->> 'debit')::numeric, 0), 2),
      round(coalesce((v_line ->> 'credit')::numeric, 0), 2),
      v_line ->> 'description'
    );
  end loop;

  update public.journal_entries set posted = true where id = v_entry;
  return v_entry;
end;
$$;

-- Reverse a posted entry (the only way to correct a posted system entry, ACCOUNTING.md)
create or replace function public.reverse_journal(p_entry_id uuid, p_entry_date date, p_memo text default null)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  e public.journal_entries%rowtype;
  v_lines jsonb;
begin
  perform public.assert_role('ceo', 'accountant');
  select * into e from public.journal_entries where id = p_entry_id;
  if not found or not e.posted then
    raise exception 'Only posted entries can be reversed' using errcode = '22023';
  end if;

  select jsonb_agg(jsonb_build_object(
           'account', a.code,
           'debit', l.credit,
           'credit', l.debit,
           'description', 'Reversal: ' || coalesce(l.description, '')))
    into v_lines
  from public.journal_lines l join public.accounts a on a.id = l.account_id
  where l.entry_id = p_entry_id;

  return public.post_journal(
    p_entry_date,
    coalesce(p_memo, 'Reversal of ' || coalesce(e.reference, e.memo, e.id::text)),
    v_lines, e.source, e.source_id, e.reference, p_entry_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Deal stages
-- ---------------------------------------------------------------------------
-- stage_entered_at follows the stage change unless the caller sets it (historical seeding)
create or replace function public.deals_track_stage()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.stage_id is distinct from old.stage_id
     and new.stage_entered_at is not distinct from old.stage_entered_at then
    new.stage_entered_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.move_deal_stage(
  p_deal_id uuid,
  p_stage_name text,
  p_note text default null,
  p_at timestamptz default null
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_from uuid;
  v_from_name text;
  v_to uuid;
  v_at timestamptz := coalesce(p_at, now());
begin
  perform public.assert_role('ceo');
  select d.stage_id, s.name into v_from, v_from_name
  from public.deals d join public.deal_stages s on s.id = d.stage_id
  where d.id = p_deal_id
  for update of d;
  if not found then raise exception 'Deal not found' using errcode = 'P0002'; end if;

  select id into v_to from public.deal_stages where name = p_stage_name;
  if v_to is null then raise exception 'Unknown stage %', p_stage_name using errcode = '22023'; end if;
  if v_to = v_from then return; end if;

  update public.deals set stage_id = v_to, stage_entered_at = v_at where id = p_deal_id;
  insert into public.deal_stage_history (deal_id, from_stage_id, to_stage_id, changed_at, note, created_at)
  values (p_deal_id, v_from, v_to, v_at, p_note, v_at);
  insert into public.activities (entity_type, entity_id, kind, body, occurred_at, created_at)
  values ('deal', p_deal_id, 'system',
          'Moved from ' || v_from_name || ' to ' || p_stage_name || coalesce(' — ' || p_note, ''),
          v_at, v_at);
end;
$$;

-- ---------------------------------------------------------------------------
-- Repayment schedule (WORKFLOWS.md §3, DECISIONS.md): flat interest
--   total interest = amount × monthly rate × tenor months
--   monthly: tenor instalments; quarterly: ceil(tenor/3) instalments every 3 months;
--   bullet: one instalment. Equal principal and interest per instalment; rounding on the last.
-- ---------------------------------------------------------------------------
create or replace function public.generate_repayment_schedule(p_deal_id uuid)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  d public.deals%rowtype;
  v_n integer;
  v_step integer;
  v_interest numeric;
  v_p numeric;
  v_i numeric;
  v_due date;
  k integer;
begin
  perform public.assert_role('ceo');
  select * into d from public.deals where id = p_deal_id for update;
  if not found then raise exception 'Deal not found' using errcode = 'P0002'; end if;
  if d.amount_disbursed is null or d.tenor_months is null or d.interest_rate_monthly is null
     or d.repayment_frequency is null or d.first_repayment_date is null then
    raise exception 'Disbursed amount, tenor, monthly rate, frequency and first repayment date are required'
      using errcode = '22023';
  end if;
  if exists (select 1 from public.repayment_reports r join public.repayment_schedules s on s.id = r.schedule_id
             where s.deal_id = p_deal_id) then
    raise exception 'The schedule already has repayments and cannot be regenerated' using errcode = '22023';
  end if;

  delete from public.repayment_schedules where deal_id = p_deal_id;

  v_n := case d.repayment_frequency
           when 'monthly' then d.tenor_months
           when 'quarterly' then ceil(d.tenor_months / 3.0)::integer
           else 1 end;
  v_step := case d.repayment_frequency when 'monthly' then 1 when 'quarterly' then 3 else 0 end;
  v_interest := round(d.amount_disbursed * d.interest_rate_monthly / 100 * d.tenor_months, 2);

  for k in 1 .. v_n loop
    v_due := (d.first_repayment_date + make_interval(months => (k - 1) * v_step))::date;
    if k < v_n then
      v_p := round(d.amount_disbursed / v_n, 2);
      v_i := round(v_interest / v_n, 2);
    else
      v_p := d.amount_disbursed - round(d.amount_disbursed / v_n, 2) * (v_n - 1);
      v_i := v_interest - round(v_interest / v_n, 2) * (v_n - 1);
    end if;
    insert into public.repayment_schedules (deal_id, instalment_no, due_date, principal_due, interest_due, total_due)
    values (p_deal_id, k, v_due, v_p, v_i, v_p + v_i);
  end loop;

  update public.deals set maturity_date = v_due where id = p_deal_id;
  return v_n;
end;
$$;

-- Status of one instalment (DECISIONS.md: a partly paid instalment past due is Overdue)
create or replace function public.refresh_schedule_status(p_schedule_id uuid, p_today date default null)
returns public.instalment_status
language plpgsql
set search_path = ''
as $$
declare
  s public.repayment_schedules%rowtype;
  v_today date := coalesce(p_today, public.lagos_today());
  v_confirmed numeric;
  v_pending boolean;
  v_status public.instalment_status;
begin
  select * into s from public.repayment_schedules where id = p_schedule_id for update;
  if not found then return null; end if;

  select coalesce(sum(amount) filter (where confirmed_by_financier), 0),
         coalesce(bool_or(not confirmed_by_financier), false)
    into v_confirmed, v_pending
  from public.repayment_reports where schedule_id = p_schedule_id;

  v_status := case
    when v_confirmed >= s.total_due then 'confirmed'
    when v_pending then 'reported'
    when s.due_date < v_today then 'overdue'
    when v_confirmed > 0 then 'partially_paid'
    when s.due_date <= v_today + 7 then 'due'
    else 'scheduled'
  end;

  update public.repayment_schedules
  set status = v_status,
      days_overdue = case when v_status = 'overdue' then v_today - s.due_date else 0 end
  where id = p_schedule_id
    and (status is distinct from v_status
         or days_overdue is distinct from (case when v_status = 'overdue' then v_today - s.due_date else 0 end));
  return v_status;
end;
$$;

create or replace function public.refresh_all_instalment_statuses(p_today date default null)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  perform public.assert_role('ceo');
  for v_id in select id from public.repayment_schedules where status <> 'confirmed' loop
    perform public.refresh_schedule_status(v_id, p_today);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Fees (WORKFLOWS.md §4, ACCOUNTING.md): VAT-exclusive; referral fees carry no VAT
-- ---------------------------------------------------------------------------
create or replace function public.recognise_fee(p_fee_id uuid, p_earned_on date default null)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  f public.deal_fees%rowtype;
  d public.deals%rowtype;
  v_on date := coalesce(p_earned_on, public.lagos_today());
  v_base numeric;
  v_amount numeric;
  v_vat numeric := 0;
  v_receivable text;
  v_income text;
  v_lines jsonb;
  v_entry uuid;
  v_label text;
begin
  perform public.assert_role('ceo');
  select * into f from public.deal_fees where id = p_fee_id for update;
  if not found then raise exception 'Fee not found' using errcode = 'P0002'; end if;
  if f.status <> 'pending' then
    return f.journal_entry_id; -- idempotent: recognised once only
  end if;
  select * into d from public.deals where id = f.deal_id;

  v_base := coalesce(f.base_amount, d.amount_disbursed);
  if f.basis = 'percent' then
    if v_base is null then
      raise exception 'Percentage fees need a base amount (deal not disbursed yet)' using errcode = '22023';
    end if;
    v_amount := round(v_base * f.value / 100, 2);
  else
    v_amount := round(f.value, 2);
  end if;
  if v_amount <= 0 then
    raise exception 'Fee amount must be greater than zero' using errcode = '22023';
  end if;

  v_label := case f.fee_kind
               when 'provider_commission' then 'Provider commission'
               when 'client_fee' then 'Client fee'
               when 'collateral_fee' then 'Collateral negotiation fee'
               else 'Referral fee' end;

  if f.fee_kind = 'referral_fee' then
    v_lines := jsonb_build_array(
      jsonb_build_object('account', '5000', 'debit', v_amount, 'description', 'Referral fee'),
      jsonb_build_object('account', '2000', 'credit', v_amount, 'description', 'Referral fee payable'));
  else
    v_vat := round(v_amount * public.setting_numeric('vat_rate_pct', 7.5) / 100, 2);
    v_receivable := case f.fee_kind when 'provider_commission' then '1100' else '1110' end;
    v_income := case f.fee_kind when 'provider_commission' then '4000' when 'client_fee' then '4100' else '4200' end;
    v_lines := jsonb_build_array(
      jsonb_build_object('account', v_receivable, 'debit', v_amount + v_vat, 'description', v_label || ' receivable'),
      jsonb_build_object('account', v_income, 'credit', v_amount, 'description', v_label));
    if v_vat > 0 then
      v_lines := v_lines || jsonb_build_array(
        jsonb_build_object('account', '2200', 'credit', v_vat, 'description', 'VAT on ' || lower(v_label)));
    end if;
  end if;

  v_entry := public.post_journal(v_on, v_label || ' earned — ' || d.reference, v_lines, 'fee', f.id, d.reference);

  update public.deal_fees
  set base_amount = case when f.basis = 'percent' then v_base else f.base_amount end,
      computed_amount = v_amount,
      vat_amount = v_vat,
      status = 'earned',
      earned_at = public.lagos_noon(v_on),
      journal_entry_id = v_entry,
      idempotency_key = 'fee:' || f.id
  where id = f.id;
  return v_entry;
end;
$$;

create or replace function public.record_fee_receipt(
  p_fee_id uuid,
  p_received_on date default null,
  p_wht_amount numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  f public.deal_fees%rowtype;
  v_ref text;
  v_on date := coalesce(p_received_on, public.lagos_today());
  v_total numeric;
  v_wht numeric;
  v_lines jsonb;
  v_entry uuid;
begin
  perform public.assert_role('ceo', 'accountant');
  select * into f from public.deal_fees where id = p_fee_id for update;
  if not found then raise exception 'Fee not found' using errcode = 'P0002'; end if;
  if f.fee_kind = 'referral_fee' then
    raise exception 'Referral fees are paid out, not received' using errcode = '22023';
  end if;
  if f.status <> 'earned' then
    raise exception 'Only earned fees can be received (this one is %)', f.status using errcode = '22023';
  end if;
  select reference into v_ref from public.deals where id = f.deal_id;

  v_total := f.computed_amount + f.vat_amount;
  v_wht := round(coalesce(p_wht_amount, f.computed_amount * public.setting_numeric('wht_rate_pct', 10) / 100), 2);
  if v_wht < 0 or v_wht >= v_total then
    raise exception 'Withholding tax must be between zero and the amount due' using errcode = '22023';
  end if;

  v_lines := jsonb_build_array(
    jsonb_build_object('account', '1000', 'debit', v_total - v_wht, 'description', 'Fee received'));
  if v_wht > 0 then
    v_lines := v_lines || jsonb_build_array(
      jsonb_build_object('account', '1120', 'debit', v_wht, 'description', 'WHT deducted by payer'));
  end if;
  v_lines := v_lines || jsonb_build_array(
    jsonb_build_object('account', case f.fee_kind when 'provider_commission' then '1100' else '1110' end,
                       'credit', v_total, 'description', 'Fee receivable settled'));

  v_entry := public.post_journal(v_on, 'Fee received — ' || v_ref, v_lines, 'receipt', f.id, v_ref);
  update public.deal_fees set status = 'received', wht_amount = v_wht where id = f.id;
  return v_entry;
end;
$$;

create or replace function public.pay_referral_fee(p_fee_id uuid, p_paid_on date default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  f public.deal_fees%rowtype;
  v_ref text;
  v_entry uuid;
begin
  perform public.assert_role('ceo', 'accountant');
  select * into f from public.deal_fees where id = p_fee_id for update;
  if not found then raise exception 'Fee not found' using errcode = 'P0002'; end if;
  if f.fee_kind <> 'referral_fee' or f.status <> 'earned' then
    raise exception 'Only earned referral fees can be paid' using errcode = '22023';
  end if;
  select reference into v_ref from public.deals where id = f.deal_id;

  v_entry := public.post_journal(
    coalesce(p_paid_on, public.lagos_today()),
    'Referral fee paid — ' || v_ref,
    jsonb_build_array(
      jsonb_build_object('account', '2000', 'debit', f.computed_amount, 'description', 'Referral fee paid'),
      jsonb_build_object('account', '1000', 'credit', f.computed_amount, 'description', 'Paid from bank')),
    'payment', f.id, v_ref);
  update public.deal_fees set status = 'paid' where id = f.id;
  return v_entry;
end;
$$;

-- ---------------------------------------------------------------------------
-- Disbursement and repayments
-- ---------------------------------------------------------------------------
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
  perform public.move_deal_stage(p_deal_id, 'Disbursed', null,
                                 coalesce(p_at, public.lagos_noon(p_disbursed_on)));

  for v_fee in select id from public.deal_fees
               where deal_id = p_deal_id and status = 'pending' and trigger = 'on_disbursement' loop
    perform public.recognise_fee(v_fee, p_disbursed_on);
  end loop;
  return v_instalments;
end;
$$;

-- A client-reported payment, allocated to the oldest unpaid instalments (DECISIONS.md).
-- Returns one report id per instalment touched. Overpayment beyond the deal's balance is refused.
create or replace function public.report_repayment(
  p_deal_id uuid,
  p_amount numeric,
  p_paid_on date,
  p_channel public.payment_channel,
  p_proof_file_path text default null,
  p_reported_at timestamptz default null
)
returns uuid[]
language plpgsql
set search_path = ''
as $$
declare
  v_outstanding numeric;
  v_remaining numeric := round(p_amount, 2);
  v_alloc numeric;
  v_ids uuid[] := '{}';
  v_id uuid;
  s record;
begin
  perform public.assert_role('ceo');
  if v_remaining is null or v_remaining <= 0 then
    raise exception 'Amount must be greater than zero' using errcode = '22023';
  end if;

  select coalesce(sum(s2.total_due), 0) - coalesce(sum(r.amount), 0) into v_outstanding
  from public.repayment_schedules s2
  left join lateral (select sum(amount) as amount from public.repayment_reports where schedule_id = s2.id) r on true
  where s2.deal_id = p_deal_id;
  if v_remaining > v_outstanding then
    raise exception 'Payment of % is more than the deal''s outstanding balance of %', v_remaining, v_outstanding
      using errcode = '22023';
  end if;

  for s in
    select s2.id, s2.total_due - coalesce((select sum(amount) from public.repayment_reports where schedule_id = s2.id), 0) as open_amount
    from public.repayment_schedules s2
    where s2.deal_id = p_deal_id
    order by s2.instalment_no
    for update
  loop
    continue when s.open_amount <= 0;
    v_alloc := least(s.open_amount, v_remaining);
    insert into public.repayment_reports (schedule_id, amount, paid_on, channel, proof_file_path, reported_at, created_at)
    values (s.id, v_alloc, p_paid_on, p_channel, p_proof_file_path,
            coalesce(p_reported_at, now()), coalesce(p_reported_at, now()))
    returning id into v_id;
    v_ids := v_ids || v_id;
    perform public.refresh_schedule_status(s.id);
    v_remaining := v_remaining - v_alloc;
    exit when v_remaining <= 0;
  end loop;
  return v_ids;
end;
$$;

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
  v_stage text;
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

  select s.deal_id, st.name into v_deal, v_stage
  from public.repayment_schedules s
  join public.deals d on d.id = s.deal_id
  join public.deal_stages st on st.id = d.stage_id
  where s.id = r.schedule_id;

  select count(*) into v_confirmed_count
  from public.repayment_reports rr join public.repayment_schedules ss on ss.id = rr.schedule_id
  where ss.deal_id = v_deal and rr.confirmed_by_financier;

  -- First confirmed repayment: provider commission is earned; deal moves to Repaying
  if v_confirmed_count = 1 then
    for v_fee in select id from public.deal_fees
                 where deal_id = v_deal and status = 'pending' and trigger = 'on_first_repayment' loop
      perform public.recognise_fee(v_fee, (v_at at time zone 'Africa/Lagos')::date);
    end loop;
    if v_stage = 'Disbursed' then
      perform public.move_deal_stage(v_deal, 'Repaying', 'First repayment confirmed', v_at);
      v_stage := 'Repaying';
    end if;
  end if;

  -- Every instalment confirmed: the deal is complete
  if not exists (select 1 from public.repayment_schedules where deal_id = v_deal and status <> 'confirmed') then
    perform public.move_deal_stage(v_deal, 'Completed', 'All instalments confirmed', v_at);
    update public.deals set outcome = 'completed' where id = v_deal;
  end if;
  return v_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: callable by signed-in users (each function checks the role itself)
-- ---------------------------------------------------------------------------
do $$
declare f text;
begin
  foreach f in array array[
    'public.assert_role(public.app_role[])',
    'public.lagos_today()',
    'public.lagos_noon(date)',
    'public.setting_numeric(text, numeric)',
    'public.post_journal(date, text, jsonb, public.journal_source, uuid, text, uuid)',
    'public.reverse_journal(uuid, date, text)',
    'public.move_deal_stage(uuid, text, text, timestamptz)',
    'public.generate_repayment_schedule(uuid)',
    'public.refresh_schedule_status(uuid, date)',
    'public.refresh_all_instalment_statuses(date)',
    'public.recognise_fee(uuid, date)',
    'public.record_fee_receipt(uuid, date, numeric)',
    'public.pay_referral_fee(uuid, date)',
    'public.disburse_deal(uuid, numeric, date, date, public.repayment_frequency, timestamptz)',
    'public.report_repayment(uuid, numeric, date, public.payment_channel, text, timestamptz)',
    'public.confirm_repayment_report(uuid, timestamptz, text)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
