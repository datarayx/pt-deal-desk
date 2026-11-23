-- Read-only checks after seeding: every SEED_DATA.md scenario exists and the books balance.
with
  t as (select public.lagos_today() as today, extract(year from public.lagos_today())::int as y),
  deals as (
    select d.*, s.name as stage
    from public.deals d join public.deal_stages s on s.id = d.stage_id
  ),
  balances as (select type, sum(balance) as total from public.v_account_balances group by type),
  tb as (
    select coalesce(sum(debit), 0) as dr, coalesce(sum(credit), 0) as cr
    from public.trial_balance((select y || '-01' from t), (select y || '-12' from t))
  ),
  checks (check_name, expected, actual) as (
    values
      ('financiers', '6', (select count(*)::text from public.financiers)),
      ('referrers', '5', (select count(*)::text from public.referrers)),
      ('clients: companies / individuals', '12 / 6',
        (select count(*) filter (where client_type = 'company') || ' / ' || count(*) filter (where client_type = 'individual') from public.clients)),
      ('clients with KYC incomplete', '3', (select count(*)::text from public.clients where kyc_status = 'incomplete')),
      ('deals', '25', (select count(*)::text from deals)),
      ('declined by lender', '2', (select count(*)::text from deals where outcome = 'declined_by_lender')),
      ('declined by client', '1', (select count(*)::text from deals where outcome = 'declined_by_client')),
      ('negotiating', '1', (select count(*)::text from deals where outcome = 'negotiating')),
      ('stale (open, > 30 days in a non-terminal stage)', '3',
        (select count(*)::text from deals where outcome = 'open' and stage not in ('Disbursed', 'Repaying', 'Completed')
           and stage_entered_at < now() - interval '30 days')),
      ('disbursed / repaying (open)', '8', (select count(*)::text from deals where stage in ('Disbursed', 'Repaying') and outcome = 'open')),
      ('completed', '2', (select count(*)::text from deals where outcome = 'completed' and stage = 'Completed')),
      ('defaulted', '1', (select count(*)::text from deals where outcome = 'defaulted')),
      ('overdue instalments (all on the defaulter)', '2 on 1 deal',
        (select count(*) || ' on ' || count(distinct deal_id) || ' deal' from public.repayment_schedules where status = 'overdue')),
      ('reported, awaiting confirmation', '≥ 1', (select count(*)::text from public.repayment_schedules where status = 'reported')),
      ('due within 7 days', '≥ 0', (select count(*)::text from public.repayment_schedules where status in ('due', 'partially_paid'))),
      ('confirmed instalments', '> 0', (select count(*)::text from public.repayment_schedules where status = 'confirmed')),
      ('open follow-up call tasks', '2', (select count(*)::text from public.follow_up_tasks where status = 'open')),
      ('disbursements span (days ago, oldest–newest)', '~40–290',
        (select max(t.today - disbursement_date) || '–' || min(t.today - disbursement_date) from deals, t where disbursement_date is not null)),
      ('fees earned / received / paid / pending', 'mix',
        (select count(*) filter (where status = 'earned') || ' / ' || count(*) filter (where status = 'received') || ' / '
              || count(*) filter (where status = 'paid') || ' / ' || count(*) filter (where status = 'pending') from public.deal_fees)),
      ('referral fees paid / outstanding', '2 / 3',
        (select count(*) filter (where status = 'paid') || ' / ' || count(*) filter (where status = 'earned') from public.deal_fees where fee_kind = 'referral_fee')),
      ('journals (all posted)', 'all',
        (select count(*) filter (where posted) || ' of ' || count(*) from public.journal_entries)),
      ('trial balance: debits = credits', 'true', (select (dr = cr)::text || ' (₦' || to_char(dr, 'FM999,999,999,990.00') || ')' from tb)),
      ('balance sheet: assets = liabilities + equity + profit', 'true',
        (select (coalesce(max(total) filter (where type = 'asset'), 0)
                 = coalesce(max(total) filter (where type = 'liability'), 0) + coalesce(max(total) filter (where type = 'equity'), 0)
                   + coalesce(max(total) filter (where type = 'income'), 0) - coalesce(max(total) filter (where type = 'expense'), 0))::text
         from balances)),
      ('bank balance today is positive', 'true',
        (select (balance >= 0)::text || ' (₦' || to_char(balance, 'FM999,999,999,990.00') || ')' from public.v_account_balances where code = '1000')),
      ('locked periods', 'months to 3 ago', (select coalesce(min(period) || '..' || max(period), 'none') from public.periods where is_locked))
  )
select check_name, expected, actual from checks;
