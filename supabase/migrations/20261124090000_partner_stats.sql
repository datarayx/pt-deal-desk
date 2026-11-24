-- Tasks 2.2 / 2.3 — partner directories.
-- 1. v_financier_stats and v_referrer_stats: per-partner counts and naira totals, summed in
--    Postgres (money returned as text so the app never does float maths). security_invoker, so
--    the CEO-only RLS on financiers/referrers/deals/clients applies; deal_fees is readable by
--    the accountant too, but the joins through referrers/deals return nothing for them.
-- 2. financiers.facility_types holds facility-type NAMES; keep them in step when a facility
--    type is renamed or deleted in Settings.

create view public.v_financier_stats with (security_invoker = true) as
select
  f.id as financier_id,
  coalesce(d.deal_count, 0) as deal_count,
  coalesce(d.pipeline_count, 0) as pipeline_count,
  coalesce(d.funded_count, 0) as funded_count,
  coalesce(d.total_disbursed, 0)::text as total_disbursed,
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

comment on view public.v_financier_stats is 'Per financier: deals, open pipeline, funded deals, total disbursed (text), template size.';

create view public.v_referrer_stats with (security_invoker = true) as
select
  r.id as referrer_id,
  coalesce(c.clients_referred, 0) as clients_referred,
  coalesce(d.deal_count, 0) as deal_count,
  coalesce(d.deals_funded, 0) as deals_funded,
  coalesce(d.amount_funded, 0)::text as amount_funded,
  coalesce(fe.fees_earned, 0)::text as fees_earned,
  coalesce(fe.fees_paid, 0)::text as fees_paid,
  coalesce(fe.fees_payable, 0)::text as fees_payable,
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
  -- Earned = recognised (earned or already paid); payable = earned but not yet paid;
  -- pending = agreed on a deal that hasn't hit its trigger yet (no amount until then).
  select
    sum(f.computed_amount) filter (where f.status in ('earned', 'paid')) as fees_earned,
    sum(f.computed_amount) filter (where f.status = 'paid') as fees_paid,
    sum(f.computed_amount) filter (where f.status = 'earned') as fees_payable,
    count(*) filter (where f.status = 'pending')::int as fees_pending_count
  from public.deal_fees f
  join public.deals x on x.id = f.deal_id
  where x.referrer_id = r.id and f.fee_kind = 'referral_fee'
) fe on true;

comment on view public.v_referrer_stats is 'Per referrer: clients referred, deals, funded deals and amount, referral fees earned / paid / payable (text).';

do $$
declare v text;
begin
  foreach v in array array['v_financier_stats', 'v_referrer_stats'] loop
    execute format('revoke all on public.%I from anon', v);
    execute format('revoke all on public.%I from authenticated', v);
    execute format('grant select on public.%I to authenticated', v);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Keep financiers.facility_types (names) in step with facility_types
-- ---------------------------------------------------------------------------
create or replace function public.facility_types_sync_financiers()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.name is distinct from old.name then
    update public.financiers
       set facility_types = array_replace(facility_types, old.name, new.name)
     where old.name = any (facility_types);
    return new;
  elsif tg_op = 'DELETE' then
    update public.financiers
       set facility_types = array_remove(facility_types, old.name)
     where old.name = any (facility_types);
    return old;
  end if;
  return new;
end
$$;
comment on function public.facility_types_sync_financiers() is 'Renames/removes a facility type name inside financiers.facility_types.';
revoke all on function public.facility_types_sync_financiers() from public, anon, authenticated;

create trigger facility_types_sync_financiers
after update of name or delete on public.facility_types
for each row execute function public.facility_types_sync_financiers();
