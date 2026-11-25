-- Backfill finance-safe summaries for reminder alerts generated before the
-- accountant-summary trigger was installed.

insert into public.alerts (user_id, kind, title, body, link, created_at)
select
  p.id,
  'system'::public.alert_kind,
  case summary.kind
    when 'due_soon'::public.alert_kind then 'Upcoming repayment reminder'
    when 'due_today'::public.alert_kind then 'Repayment due today'
    when 'overdue'::public.alert_kind then 'Overdue repayment update'
  end,
  case summary.kind
    when 'due_soon'::public.alert_kind then
      'A repayment reminder was generated. Open the Finance dashboard for the latest position.'
    when 'due_today'::public.alert_kind then
      'A repayment is due today. Open the Finance dashboard for the latest position.'
    when 'overdue'::public.alert_kind then
      'An overdue repayment update is available. Open the Finance dashboard for the latest position.'
  end,
  '/finance',
  summary.alert_day
from public.profiles p
cross join (
  select kind, date_trunc('day', created_at) as alert_day
  from public.alerts
  where user_id is null
    and kind in (
      'due_soon'::public.alert_kind,
      'due_today'::public.alert_kind,
      'overdue'::public.alert_kind
    )
  group by kind, date_trunc('day', created_at)
) summary
where p.role = 'accountant'::public.app_role
  and p.is_active
  and not exists (
    select 1
    from public.alerts existing
    where existing.user_id = p.id
      and existing.kind = 'system'::public.alert_kind
      and existing.title = case summary.kind
        when 'due_soon'::public.alert_kind then 'Upcoming repayment reminder'
        when 'due_today'::public.alert_kind then 'Repayment due today'
        when 'overdue'::public.alert_kind then 'Overdue repayment update'
      end
      and existing.created_at::date = summary.alert_day::date
  );

