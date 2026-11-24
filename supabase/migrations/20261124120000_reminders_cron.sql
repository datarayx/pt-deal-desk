-- Tasks 4.1 / 4.2 — daily reminders, duplicate suppression and demo Outbox.
-- pg_cron uses UTC: 06:00 UTC is 07:00 Africa/Lagos.

create or replace function public.run_daily_reminders(p_run_date date default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := coalesce(p_run_date, public.lagos_today());
  v_weekday text := lower(to_char(coalesce(p_run_date, public.lagos_today()), 'Dy'));
  v_due_days integer[];
  v_overdue_email_weekdays text[];
  v_stale_days integer := 30;
  v_condition public.reminder_condition;
  v_alert_kind public.alert_kind;
  v_log_id uuid;
  v_recipients text[];
  v_alerts integer := 0;
  v_outbox integer := 0;
  v_follow_ups integer := 0;
  v_processed integer := 0;
  v_assignee uuid;
  v_row record;
begin
  perform public.assert_role('ceo');

  -- Refreshing first makes the reminder query use the same Lagos-day status as the UI.
  perform public.refresh_all_instalment_statuses(v_today);

  select coalesce(
    array_agg(value::integer order by ordinality),
    array[7, 3, 0]::integer[]
  )
    into v_due_days
  from jsonb_array_elements_text(
    coalesce((select s.value from public.settings s where s.key = 'reminder_days_before_due'), '[7,3,0]'::jsonb)
  ) with ordinality;

  select coalesce(
    array_agg(lower(value) order by ordinality),
    array['mon', 'thu']::text[]
  )
    into v_overdue_email_weekdays
  from jsonb_array_elements_text(
    coalesce((select s.value from public.settings s where s.key = 'overdue_email_weekdays'), '["mon","thu"]'::jsonb)
  ) with ordinality;

  select coalesce((s.value #>> '{}')::integer, 30)
    into v_stale_days
  from public.settings s
  where s.key = 'stale_deal_days';
  v_stale_days := coalesce(v_stale_days, 30);

  -- Due soon / due today: one alert and one demo email per instalment and channel.
  for v_row in
    select
      rs.id as schedule_id,
      rs.deal_id,
      rs.due_date,
      rs.total_due,
      d.reference,
      c.display_name
    from public.repayment_schedules rs
    join public.deals d on d.id = rs.deal_id
    join public.clients c on c.id = d.client_id
    where rs.status <> 'confirmed'
      and rs.due_date >= v_today
      and (rs.due_date - v_today) = any (v_due_days)
    order by rs.due_date, d.reference, rs.instalment_no
  loop
    v_processed := v_processed + 1;
    v_condition := case v_row.due_date - v_today
      when 0 then 'due_0'::public.reminder_condition
      when 3 then 'due_3'::public.reminder_condition
      else 'due_7'::public.reminder_condition
    end;
    v_alert_kind := case when v_condition = 'due_0' then 'due_today'::public.alert_kind else 'due_soon'::public.alert_kind end;

    insert into public.reminder_log (schedule_id, deal_id, condition, channel, sent_on)
    values (v_row.schedule_id, v_row.deal_id, v_condition, 'alert', v_today)
    on conflict (schedule_id, deal_id, condition, channel, sent_on) do nothing
    returning id into v_log_id;

    if v_log_id is not null then
      insert into public.alerts (user_id, kind, title, body, link)
      values (
        null,
        v_alert_kind,
        case when v_condition = 'due_0' then 'Repayment due today' else format('Repayment due in %s days', v_row.due_date - v_today) end,
        format('%s · %s · ₦%s', v_row.display_name, v_row.reference, to_char(v_row.total_due, 'FM999G999G999G990D00')),
        '/repayments'
      );
      v_alerts := v_alerts + 1;
    end if;
    v_log_id := null;

    select coalesce(array_agg(n.email order by n.email), '{}'::text[])
      into v_recipients
    from public.notification_recipients n
    where n.is_active
      and v_alert_kind::text = any (n.alert_types::text[]);

    if cardinality(v_recipients) > 0 then
      insert into public.reminder_log (schedule_id, deal_id, condition, channel, sent_on)
      values (v_row.schedule_id, v_row.deal_id, v_condition, 'email', v_today)
      on conflict (schedule_id, deal_id, condition, channel, sent_on) do nothing
      returning id into v_log_id;

      if v_log_id is not null then
        insert into public.outbox_emails (to_emails, subject, html, related_entity, status)
        values (
          v_recipients,
          case when v_condition = 'due_0' then format('Repayment due today · %s', v_row.reference)
               else format('Repayment due in %s days · %s', v_row.due_date - v_today, v_row.reference) end,
          format('<!doctype html><html><body><h2>%s</h2><p>%s · %s · ₦%s</p><p>Due on %s.</p><p>Open P&amp;T Deal Desk to review the repayment.</p></body></html>',
            case when v_condition = 'due_0' then 'Repayment due today' else format('Repayment due in %s days', v_row.due_date - v_today) end,
            v_row.display_name, v_row.reference, to_char(v_row.total_due, 'FM999G999G999G990D00'), v_row.due_date),
          format('schedule:%s', v_row.schedule_id),
          'demo'
        );
        v_outbox := v_outbox + 1;
      end if;
    end if;
    v_log_id := null;
  end loop;

  -- Overdue alerts are daily. The matching email is only created on configured weekdays.
  for v_row in
    select
      rs.id as schedule_id,
      rs.deal_id,
      rs.due_date,
      rs.total_due,
      rs.days_overdue,
      d.reference,
      d.owner_id,
      c.display_name
    from public.repayment_schedules rs
    join public.deals d on d.id = rs.deal_id
    join public.clients c on c.id = d.client_id
    where rs.status <> 'confirmed'
      and rs.due_date < v_today
    order by rs.due_date, d.reference, rs.instalment_no
  loop
    v_processed := v_processed + 1;

    insert into public.reminder_log (schedule_id, deal_id, condition, channel, sent_on)
    values (v_row.schedule_id, v_row.deal_id, 'overdue', 'alert', v_today)
    on conflict (schedule_id, deal_id, condition, channel, sent_on) do nothing
    returning id into v_log_id;

    if v_log_id is not null then
      insert into public.alerts (user_id, kind, title, body, link)
      values (
        null,
        'overdue',
        format('Repayment overdue %s days', v_today - v_row.due_date),
        format('%s · %s · ₦%s outstanding', v_row.display_name, v_row.reference, to_char(v_row.total_due, 'FM999G999G999G990D00')),
        '/repayments'
      );
      v_alerts := v_alerts + 1;
    end if;
    v_log_id := null;

    -- The partial unique index makes this safe if the job is retried concurrently.
    select coalesce(v_row.owner_id, p.id)
      into v_assignee
    from public.profiles p
    where p.role = 'ceo' and p.is_active
    order by p.created_at
    limit 1;

    insert into public.follow_up_tasks (deal_id, schedule_id, due_date, assigned_to)
    values (v_row.deal_id, v_row.schedule_id, v_today, v_assignee)
    on conflict do nothing;
    if found then v_follow_ups := v_follow_ups + 1; end if;

    if v_weekday = any (v_overdue_email_weekdays) then
      select coalesce(array_agg(n.email order by n.email), '{}'::text[])
        into v_recipients
      from public.notification_recipients n
      where n.is_active and 'overdue' = any (n.alert_types::text[]);

      if cardinality(v_recipients) > 0 then
        insert into public.reminder_log (schedule_id, deal_id, condition, channel, sent_on)
        values (v_row.schedule_id, v_row.deal_id, 'overdue', 'email', v_today)
        on conflict (schedule_id, deal_id, condition, channel, sent_on) do nothing
        returning id into v_log_id;

        if v_log_id is not null then
          insert into public.outbox_emails (to_emails, subject, html, related_entity, status)
          values (
            v_recipients,
            format('Overdue repayment · %s', v_row.reference),
            format('<!doctype html><html><body><h2>Overdue repayment</h2><p>%s · %s · ₦%s outstanding.</p><p>This instalment is %s days overdue. A follow-up call task has been created.</p><p>Open P&amp;T Deal Desk to review the repayment.</p></body></html>',
              v_row.display_name, v_row.reference, to_char(v_row.total_due, 'FM999G999G999G990D00'), v_today - v_row.due_date),
            format('schedule:%s', v_row.schedule_id),
            'demo'
          );
          v_outbox := v_outbox + 1;
        end if;
      end if;
    end if;
    v_log_id := null;
  end loop;

  -- Stale deals alert daily; stale-deal email is weekly on Monday.
  for v_row in
    select
      d.id as deal_id,
      d.reference,
      d.stage_entered_at,
      c.display_name,
      st.name as stage_name
    from public.deals d
    join public.clients c on c.id = d.client_id
    join public.deal_stages st on st.id = d.stage_id
    where d.outcome in ('open', 'negotiating')
      and not st.is_terminal
      and (d.stage_entered_at at time zone 'Africa/Lagos')::date <= v_today - v_stale_days
    order by d.stage_entered_at, d.reference
  loop
    v_processed := v_processed + 1;

    insert into public.reminder_log (deal_id, condition, channel, sent_on)
    values (v_row.deal_id, 'stale_deal', 'alert', v_today)
    on conflict (schedule_id, deal_id, condition, channel, sent_on) do nothing
    returning id into v_log_id;

    if v_log_id is not null then
      insert into public.alerts (user_id, kind, title, body, link)
      values (
        null,
        'stale_deal',
        format('Deal stale for more than %s days', v_stale_days),
        format('%s · %s · still in %s', v_row.display_name, v_row.reference, v_row.stage_name),
        '/deals'
      );
      v_alerts := v_alerts + 1;
    end if;
    v_log_id := null;

    if extract(isodow from v_today) = 1 then
      select coalesce(array_agg(n.email order by n.email), '{}'::text[])
        into v_recipients
      from public.notification_recipients n
      where n.is_active and 'stale_deal' = any (n.alert_types::text[]);

      if cardinality(v_recipients) > 0 then
        insert into public.reminder_log (deal_id, condition, channel, sent_on)
        values (v_row.deal_id, 'stale_deal', 'email', v_today)
        on conflict (schedule_id, deal_id, condition, channel, sent_on) do nothing
        returning id into v_log_id;

        if v_log_id is not null then
          insert into public.outbox_emails (to_emails, subject, html, related_entity, status)
          values (
            v_recipients,
            format('Stale deal · %s', v_row.reference),
            format('<!doctype html><html><body><h2>Stale deal</h2><p>%s · %s is still in %s after more than %s days.</p><p>Open P&amp;T Deal Desk to review the deal.</p></body></html>',
              v_row.display_name, v_row.reference, v_row.stage_name, v_stale_days),
            format('deal:%s', v_row.deal_id),
            'demo'
          );
          v_outbox := v_outbox + 1;
        end if;
      end if;
    end if;
    v_log_id := null;
  end loop;

  return jsonb_build_object(
    'run_date', v_today,
    'processed', v_processed,
    'alerts', v_alerts,
    'outbox_emails', v_outbox,
    'follow_up_tasks', v_follow_ups
  );
end;
$$;

revoke all on function public.run_daily_reminders(date) from public, anon;
grant execute on function public.run_daily_reminders(date) to authenticated;

-- pg_cron is available in Supabase projects and is intentionally installed in extensions.
create extension if not exists pg_cron with schema extensions;

do $$
declare
  v_job_id bigint;
  v_unscheduled boolean;
begin
  for v_job_id in
    select jobid from cron.job where jobname = 'pt-deal-desk-daily-reminders'
  loop
    execute 'select cron.unschedule($1)' into v_unscheduled using v_job_id;
  end loop;
  perform cron.schedule('pt-deal-desk-daily-reminders', '0 6 * * *', 'select public.run_daily_reminders();');
exception
  when undefined_file or undefined_function or insufficient_privilege then
    raise notice 'pg_cron is not enabled; run_daily_reminders remains available for a hosted scheduler.';
end;
$$;
