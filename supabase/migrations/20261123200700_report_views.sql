-- Task 1.1 (8/8) — report views (docs/DATA_MODEL.md "Views").
-- All views are security_invoker: they run with the caller's rights, so RLS on the underlying
-- tables still applies (the accountant sees nothing from pipeline/overdue, which read deals).
-- The one deliberate exception is the accountant-safe fee list, exposed through a narrow
-- SECURITY DEFINER function that returns only fee fields + deal reference, client display name
-- and financier name (SECURITY.md).
-- v_client_reliability is built with its scoring rules in task 4.3.

-- Balances per account from POSTED entries. Natural sign: debit-normal for assets/expenses.
create view public.v_account_balances with (security_invoker = true) as
select
  a.id as account_id,
  a.code,
  a.name,
  a.type,
  coalesce(sum(l.debit), 0)::numeric(18, 2)  as total_debit,
  coalesce(sum(l.credit), 0)::numeric(18, 2) as total_credit,
  (case when a.type in ('asset', 'expense')
        then coalesce(sum(l.debit), 0) - coalesce(sum(l.credit), 0)
        else coalesce(sum(l.credit), 0) - coalesce(sum(l.debit), 0) end)::numeric(18, 2) as balance
from public.accounts a
left join public.journal_lines l on l.account_id = a.id
  and exists (select 1 from public.journal_entries e where e.id = l.entry_id and e.posted)
group by a.id, a.code, a.name, a.type;

-- Trial balance for posted entries in [period_from, period_to] (YYYY-MM). Net per account,
-- shown in the debit or credit column. Opening balances / prior-period comparison: task 3.4.
create or replace function public.trial_balance(period_from text, period_to text)
returns table (account_id uuid, code text, name text, type public.account_type, debit numeric, credit numeric)
language sql
stable
set search_path = ''
as $$
  with movement as (
    select l.account_id, sum(l.debit) - sum(l.credit) as net
    from public.journal_lines l
    join public.journal_entries e on e.id = l.entry_id
    where e.posted
      and e.period between period_from and period_to
    group by l.account_id
  )
  select a.id, a.code, a.name, a.type,
         greatest(m.net, 0)::numeric(18, 2),
         greatest(-m.net, 0)::numeric(18, 2)
  from movement m
  join public.accounts a on a.id = m.account_id
  where m.net <> 0
  order by a.code
$$;
revoke all on function public.trial_balance(text, text) from public, anon;
grant execute on function public.trial_balance(text, text) to authenticated;

-- Fees earned but not yet received, aged from earned_at (Lagos day)
create view public.v_receivables_aging with (security_invoker = true) as
select
  f.id as fee_id,
  f.deal_id,
  f.fee_kind,
  (coalesce(f.computed_amount, 0) + f.vat_amount)::numeric(18, 2) as amount_due,
  f.earned_at,
  ((now() at time zone 'Africa/Lagos')::date - (f.earned_at at time zone 'Africa/Lagos')::date) as days_outstanding,
  case
    when (now() at time zone 'Africa/Lagos')::date - (f.earned_at at time zone 'Africa/Lagos')::date <= 30 then '0-30'
    when (now() at time zone 'Africa/Lagos')::date - (f.earned_at at time zone 'Africa/Lagos')::date <= 60 then '31-60'
    when (now() at time zone 'Africa/Lagos')::date - (f.earned_at at time zone 'Africa/Lagos')::date <= 90 then '61-90'
    else '90+'
  end as bucket
from public.deal_fees f
where f.status = 'earned' and f.fee_kind <> 'referral_fee';

-- Unconfirmed instalments past their due date, with the unpaid balance and ageing bucket
create view public.v_overdue_ageing with (security_invoker = true) as
select
  s.id as schedule_id,
  s.deal_id,
  s.instalment_no,
  s.due_date,
  s.total_due,
  (s.total_due - coalesce(paid.amount, 0))::numeric(18, 2) as outstanding,
  ((now() at time zone 'Africa/Lagos')::date - s.due_date) as days_overdue,
  case
    when (now() at time zone 'Africa/Lagos')::date - s.due_date <= 30 then '0-30'
    when (now() at time zone 'Africa/Lagos')::date - s.due_date <= 60 then '31-60'
    when (now() at time zone 'Africa/Lagos')::date - s.due_date <= 90 then '61-90'
    else '90+'
  end as bucket
from public.repayment_schedules s
left join lateral (
  select sum(r.amount) as amount
  from public.repayment_reports r
  where r.schedule_id = s.id and r.confirmed_by_financier
) paid on true
where s.status <> 'confirmed'
  and s.due_date < (now() at time zone 'Africa/Lagos')::date
  and s.total_due - coalesce(paid.amount, 0) > 0;

-- Open pipeline per stage: count and value (approved amount, else requested)
create view public.v_pipeline_by_stage with (security_invoker = true) as
select
  st.id as stage_id,
  st.name as stage_name,
  st.sort_order,
  st.is_terminal,
  count(d.id) as deal_count,
  coalesce(sum(coalesce(d.amount_approved, d.amount_requested)), 0)::numeric(18, 2) as pipeline_value
from public.deal_stages st
left join public.deals d on d.stage_id = st.id and d.outcome in ('open', 'negotiating')
group by st.id, st.name, st.sort_order, st.is_terminal;

-- Accountant-safe fee lines: fee fields + deal reference, client display name, financier name.
create or replace function public.fee_lines_finance()
returns table (
  fee_id uuid,
  deal_id uuid,
  deal_reference text,
  client_name text,
  financier_name text,
  fee_kind public.fee_kind,
  basis public.fee_basis,
  value numeric,
  base_amount numeric,
  computed_amount numeric,
  vat_amount numeric,
  wht_amount numeric,
  status public.fee_status,
  "trigger" public.fee_trigger,
  earned_at timestamptz,
  journal_entry_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id, f.deal_id, d.reference, c.display_name, fi.name,
         f.fee_kind, f.basis, f.value, f.base_amount, f.computed_amount, f.vat_amount, f.wht_amount,
         f.status, f.trigger, f.earned_at, f.journal_entry_id
  from public.deal_fees f
  join public.deals d on d.id = f.deal_id
  join public.clients c on c.id = d.client_id
  left join public.financiers fi on fi.id = d.financier_id
  where (select public.auth_role()) in ('ceo', 'accountant')
$$;
comment on function public.fee_lines_finance() is 'Fee lines with only deal reference, client display name and financier name — safe for the accountant (SECURITY.md).';
revoke all on function public.fee_lines_finance() from public, anon;
grant execute on function public.fee_lines_finance() to authenticated;

create view public.v_fee_lines_finance with (security_invoker = true) as
select * from public.fee_lines_finance();

-- Views: no anon; authenticated may read (RLS / role checks inside decide what they see)
do $$
declare v text;
begin
  foreach v in array array['v_account_balances', 'v_receivables_aging', 'v_overdue_ageing',
                           'v_pipeline_by_stage', 'v_fee_lines_finance'] loop
    execute format('revoke all on public.%I from anon', v);
    execute format('revoke all on public.%I from authenticated', v);
    execute format('grant select on public.%I to authenticated', v);
  end loop;
end $$;
