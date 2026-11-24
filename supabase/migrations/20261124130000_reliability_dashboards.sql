-- Tasks 4.3 / 4.4 — reliability projection used by client lists, Client 360 and dashboards.
-- Money values are text at the view boundary so the app never performs floating-point sums.

create or replace view public.v_client_reliability
with (security_invoker = true)
as
with thresholds as (
  select
    coalesce((value ->> 'on_time_grace_days')::integer, 3) as grace_days,
    coalesce((value ->> 'good_on_time_pct')::numeric, 90) as good_pct,
    coalesce((value ->> 'watch_on_time_pct')::numeric, 70) as watch_pct,
    coalesce((value ->> 'high_risk_overdue_days')::integer, 30) as high_risk_overdue_days
  from (
    select coalesce(
      (select s.value from public.settings s where s.key = 'reliability_thresholds'),
      '{}'::jsonb
    ) as value
  ) settings_row
),
schedule_rollup as (
  select
    d.client_id,
    s.id as schedule_id,
    s.due_date,
    s.total_due,
    coalesce(sum(rr.amount) filter (where rr.confirmed_by_financier), 0)::numeric as confirmed_amount,
    min(rr.paid_on) filter (where rr.confirmed_by_financier) as paid_on
  from public.repayment_schedules s
  join public.deals d on d.id = s.deal_id
  left join public.repayment_reports rr on rr.schedule_id = s.id
  group by d.client_id, s.id, s.due_date, s.total_due
),
schedule_metrics as (
  select
    sr.client_id,
    count(*) filter (where sr.confirmed_amount >= sr.total_due)::integer as paid_count,
    count(*) filter (
      where sr.confirmed_amount >= sr.total_due
        and sr.paid_on is not null
        and sr.paid_on - sr.due_date <= t.grace_days
    )::integer as on_time_count,
    avg(
      case
        when sr.confirmed_amount >= sr.total_due and sr.paid_on is not null
        then greatest(sr.paid_on - sr.due_date, 0)
      end
    ) as average_days_late,
    coalesce(sum(
      case
        when sr.due_date < (now() at time zone 'Africa/Lagos')::date
          and sr.confirmed_amount < sr.total_due
        then sr.total_due - sr.confirmed_amount
        else 0
      end
    ), 0)::numeric as current_overdue_amount,
    count(*) filter (
      where sr.due_date < (now() at time zone 'Africa/Lagos')::date
        and sr.confirmed_amount < sr.total_due
    )::integer as overdue_count,
    coalesce(max(
      case
        when sr.due_date < (now() at time zone 'Africa/Lagos')::date
          and sr.confirmed_amount < sr.total_due
        then (now() at time zone 'Africa/Lagos')::date - sr.due_date
        else 0
      end
    ), 0)::integer as max_overdue_days,
    coalesce(sum(sr.total_due - sr.confirmed_amount), 0)::numeric as outstanding_amount
  from schedule_rollup sr
  cross join thresholds t
  group by sr.client_id
),
deal_metrics as (
  select
    d.client_id,
    count(*) filter (where d.outcome = 'defaulted')::integer as default_count
  from public.deals d
  group by d.client_id
),
latest_credit as (
  select distinct on (cc.client_id)
    cc.client_id,
    cc.bureau,
    cc.rating,
    cc.check_date
  from public.credit_checks cc
  order by cc.client_id, cc.check_date desc, cc.created_at desc
),
external_rollup as (
  select
    ee.client_id,
    coalesce(sum(ee.outstanding) filter (where ee.status <> 'closed'), 0)::numeric as external_exposure
  from public.external_exposures ee
  group by ee.client_id
),
metrics as (
  select
    c.id as client_id,
    coalesce(sm.paid_count, 0) as paid_count,
    coalesce(sm.on_time_count, 0) as on_time_count,
    case when coalesce(sm.paid_count, 0) = 0 then null
         else round(sm.on_time_count::numeric * 100 / sm.paid_count, 2) end as on_time_percent,
    case when coalesce(sm.paid_count, 0) = 0 then null
         else round(sm.average_days_late::numeric, 2) end as average_days_late,
    coalesce(sm.current_overdue_amount, 0)::numeric as current_overdue_amount,
    coalesce(sm.overdue_count, 0) as overdue_count,
    coalesce(sm.max_overdue_days, 0) as max_overdue_days,
    coalesce(sm.outstanding_amount, 0)::numeric as outstanding_amount,
    coalesce(dm.default_count, 0) as default_count,
    lc.bureau as latest_bureau,
    lc.rating as latest_rating,
    lc.check_date as latest_check_date,
    coalesce(er.external_exposure, 0)::numeric as external_exposure
  from public.clients c
  left join schedule_metrics sm on sm.client_id = c.id
  left join deal_metrics dm on dm.client_id = c.id
  left join latest_credit lc on lc.client_id = c.id
  left join external_rollup er on er.client_id = c.id
)
select
  m.client_id,
  m.paid_count,
  m.on_time_count,
  m.on_time_percent,
  m.average_days_late,
  m.current_overdue_amount::text as current_overdue_amount,
  m.overdue_count,
  m.max_overdue_days,
  m.outstanding_amount::text as outstanding_amount,
  m.default_count,
  m.latest_bureau,
  m.latest_rating,
  m.latest_check_date,
  m.external_exposure::text as external_exposure,
  case
    when m.default_count > 0
      or m.max_overdue_days > t.high_risk_overdue_days
      or (m.on_time_percent is not null and m.on_time_percent < t.watch_pct)
      then 'high_risk'
    when m.on_time_percent is not null
      and m.on_time_percent >= t.good_pct
      and m.overdue_count = 0
      then 'good'
    else 'watch'
  end as reliability_badge
from metrics m
cross join thresholds t;

comment on view public.v_client_reliability is 'Client reliability: paid_on-based on-time score, overdue, defaults, latest bureau and external exposure.';
revoke all on public.v_client_reliability from anon;
revoke all on public.v_client_reliability from authenticated;
grant select on public.v_client_reliability to authenticated;
