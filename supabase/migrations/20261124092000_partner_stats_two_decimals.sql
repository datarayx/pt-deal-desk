-- Tasks 2.2 / 2.3 — naira totals in the partner stats views always carry two decimals
-- ("0.00", not "0") so exports and displays are consistent. Same columns, same types (text).

create or replace view public.v_financier_stats with (security_invoker = true) as
select
  f.id as financier_id,
  coalesce(d.deal_count, 0) as deal_count,
  coalesce(d.pipeline_count, 0) as pipeline_count,
  coalesce(d.funded_count, 0) as funded_count,
  coalesce(d.total_disbursed, 0)::numeric(18, 2)::text as total_disbursed,
  coalesce(r.requirement_count, 0) as requirement_count
from public.financiers f
left join lateral (
  select
    count(*)::int as deal_count,
    count(*) filter (
      where x.amount_disbursed is null and x.outcome in ('open', 'negotiating')
    )::int as pipeline_count,
    count(*) filter (where x.amount_disbursed is not null)::int as funded_count,
    sum(x.amount_disbursed) as total_disbursed
  from public.deals x
  where x.financier_id = f.id
) d on true
left join lateral (
  select count(*)::int as requirement_count
  from public.financier_requirements q
  where q.financier_id = f.id
) r on true;

create or replace view public.v_referrer_stats with (security_invoker = true) as
select
  r.id as referrer_id,
  coalesce(c.clients_referred, 0) as clients_referred,
  coalesce(d.deal_count, 0) as deal_count,
  coalesce(d.deals_funded, 0) as deals_funded,
  coalesce(d.amount_funded, 0)::numeric(18, 2)::text as amount_funded,
  coalesce(fe.fees_earned, 0)::numeric(18, 2)::text as fees_earned,
  coalesce(fe.fees_paid, 0)::numeric(18, 2)::text as fees_paid,
  coalesce(fe.fees_payable, 0)::numeric(18, 2)::text as fees_payable,
  coalesce(fe.fees_pending_count, 0) as fees_pending_count
from public.referrers r
left join lateral (
  select count(*)::int as clients_referred
  from public.clients x
  where x.referrer_id = r.id
) c on true
left join lateral (
  select
    count(*)::int as deal_count,
    count(*) filter (where x.amount_disbursed is not null)::int as deals_funded,
    sum(x.amount_disbursed) as amount_funded
  from public.deals x
  where x.referrer_id = r.id
) d on true
left join lateral (
  select
    sum(f.computed_amount) filter (where f.status in ('earned', 'paid')) as fees_earned,
    sum(f.computed_amount) filter (where f.status = 'paid') as fees_paid,
    sum(f.computed_amount) filter (where f.status = 'earned') as fees_payable,
    count(*) filter (where f.status = 'pending')::int as fees_pending_count
  from public.deal_fees f
  join public.deals x on x.id = f.deal_id
  where x.referrer_id = r.id and f.fee_kind = 'referral_fee'
) fe on true;
