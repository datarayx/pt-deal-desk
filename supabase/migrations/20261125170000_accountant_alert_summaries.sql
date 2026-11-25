-- Accountant-safe reminder summaries.
-- Accountants can see finance notifications in the bell, but never the CEO's
-- client/deal-level reminder text or links to operational screens.

create or replace function public.emit_accountant_alert_summary()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
  v_body text;
begin
  if new.user_id is not null or new.kind not in (
    'due_soon'::public.alert_kind,
    'due_today'::public.alert_kind,
    'overdue'::public.alert_kind
  ) then
    return new;
  end if;

  v_title := case new.kind
    when 'due_soon'::public.alert_kind then 'Upcoming repayment reminder'
    when 'due_today'::public.alert_kind then 'Repayment due today'
    when 'overdue'::public.alert_kind then 'Overdue repayment update'
  end;

  v_body := case new.kind
    when 'due_soon'::public.alert_kind then
      'A repayment reminder was generated. Open the Finance dashboard for the latest position.'
    when 'due_today'::public.alert_kind then
      'A repayment is due today. Open the Finance dashboard for the latest position.'
    when 'overdue'::public.alert_kind then
      'An overdue repayment update is available. Open the Finance dashboard for the latest position.'
  end;

  insert into public.alerts (user_id, kind, title, body, link)
  select
    p.id,
    'system'::public.alert_kind,
    v_title,
    v_body,
    '/finance'
  from public.profiles p
  where p.role = 'accountant'::public.app_role
    and p.is_active
    and not exists (
      select 1
      from public.alerts existing
      where existing.user_id = p.id
        and existing.kind = 'system'::public.alert_kind
        and existing.title = v_title
        and existing.created_at >= date_trunc('day', new.created_at)
        and existing.created_at < date_trunc('day', new.created_at) + interval '1 day'
    );

  return new;
end;
$$;

revoke all on function public.emit_accountant_alert_summary() from public, anon, authenticated;

drop trigger if exists alerts_accountant_summary on public.alerts;
create trigger alerts_accountant_summary
after insert on public.alerts
for each row execute function public.emit_accountant_alert_summary();

comment on function public.emit_accountant_alert_summary() is
  'Creates one sanitized finance-only alert per active accountant for each reminder category and Lagos day.';

