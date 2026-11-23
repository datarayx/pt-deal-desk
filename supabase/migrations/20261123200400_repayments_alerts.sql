-- Task 1.1 (5/8) — repayments, follow-ups, alerts, outbox (docs/DATA_MODEL.md, WORKFLOWS.md §3, §5).
-- repayment_* and follow_up_tasks: CEO only (SECURITY.md). Alerts: each user sees their own;
-- alerts with no user_id are shared by CEOs. Outbox: CEO only.

create table public.repayment_schedules (
  id             uuid primary key default gen_random_uuid(),
  deal_id        uuid not null references public.deals (id) on delete cascade,
  instalment_no  integer not null check (instalment_no >= 1),
  due_date       date not null,
  principal_due  numeric(18, 2) not null check (principal_due >= 0),
  interest_due   numeric(18, 2) not null check (interest_due >= 0),
  total_due      numeric(18, 2) not null check (total_due > 0),
  status         public.instalment_status not null default 'scheduled',
  days_overdue   integer not null default 0 check (days_overdue >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz,
  created_by     uuid default auth.uid() references auth.users (id) on delete set null,
  constraint repayment_schedules_instalment_key unique (deal_id, instalment_no),
  constraint repayment_schedules_total check (total_due = principal_due + interest_due)
);
create index repayment_schedules_due_idx on public.repayment_schedules (due_date, status);
create index repayment_schedules_open_idx on public.repayment_schedules (status) where status not in ('confirmed');
create index repayment_schedules_created_by_idx on public.repayment_schedules (created_by);

-- A client-reported payment against one instalment. A payment covering several instalments is
-- recorded as one report per instalment (oldest first, DECISIONS.md).
create table public.repayment_reports (
  id                      uuid primary key default gen_random_uuid(),
  schedule_id             uuid not null references public.repayment_schedules (id) on delete cascade,
  amount                  numeric(18, 2) not null check (amount > 0),
  paid_on                 date not null,
  channel                 public.payment_channel not null,
  proof_file_path         text check (proof_file_path ~ '^[A-Za-z0-9/_.\-]+$'),
  reported_at             timestamptz not null default now(),
  confirmed_by_financier  boolean not null default false,
  confirmed_at            timestamptz,
  confirmation_note       text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz,
  created_by              uuid default auth.uid() references auth.users (id) on delete set null,
  constraint repayment_reports_confirmation_pair check (confirmed_by_financier = (confirmed_at is not null))
);
create index repayment_reports_schedule_idx on public.repayment_reports (schedule_id);
create index repayment_reports_unconfirmed_idx on public.repayment_reports (reported_at) where not confirmed_by_financier;
create index repayment_reports_created_by_idx on public.repayment_reports (created_by);

create table public.follow_up_tasks (
  id                   uuid primary key default gen_random_uuid(),
  deal_id              uuid not null references public.deals (id) on delete cascade,
  schedule_id          uuid references public.repayment_schedules (id) on delete set null,
  due_date             date not null,
  assigned_to          uuid references auth.users (id) on delete set null,
  status               public.task_status not null default 'open',
  outcome              text,
  promise_to_pay_date  date,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz,
  created_by           uuid default auth.uid() references auth.users (id) on delete set null,
  constraint follow_up_tasks_done_has_outcome check (status = 'open' or nullif(btrim(outcome), '') is not null)
);
-- WORKFLOWS.md §5: create a call task for an overdue instalment only "if none open"
create unique index follow_up_tasks_one_open_per_instalment on public.follow_up_tasks (schedule_id)
  where status = 'open' and schedule_id is not null;
create index follow_up_tasks_deal_idx on public.follow_up_tasks (deal_id);
create index follow_up_tasks_open_due_idx on public.follow_up_tasks (due_date) where status = 'open';
create index follow_up_tasks_assigned_idx on public.follow_up_tasks (assigned_to);
create index follow_up_tasks_created_by_idx on public.follow_up_tasks (created_by);

create table public.alerts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete cascade,
  kind        public.alert_kind not null,
  title       text not null check (char_length(title) between 1 and 200),
  body        text check (char_length(body) <= 2000),
  link        text check (link ~ '^/[A-Za-z0-9/_\-?=&.%]*$'),
  read_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  created_by  uuid default auth.uid() references auth.users (id) on delete set null
);
create index alerts_user_unread_idx on public.alerts (user_id, created_at desc) where read_at is null;
create index alerts_created_idx on public.alerts (created_at desc);
create index alerts_created_by_idx on public.alerts (created_by);

create table public.outbox_emails (
  id              uuid primary key default gen_random_uuid(),
  to_emails       text[] not null check (cardinality(to_emails) > 0),
  subject         text not null check (char_length(subject) between 1 and 300),
  html            text not null,
  related_entity  text check (related_entity ~ '^(client|deal|schedule|referrer):[0-9a-f-]{36}$'),
  status          public.outbox_status not null default 'queued',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  created_by      uuid default auth.uid() references auth.users (id) on delete set null
);
create index outbox_emails_created_idx on public.outbox_emails (created_at desc);
create index outbox_emails_created_by_idx on public.outbox_emails (created_by);

-- RLS -----------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['repayment_schedules', 'repayment_reports', 'follow_up_tasks', 'outbox_emails'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.auth_role()) = ''ceo'') with check ((select public.auth_role()) = ''ceo'')',
      t || ': ceo all', t);
  end loop;
end $$;

alter table public.alerts enable row level security;
create policy "alerts: read own or shared (ceo)" on public.alerts for select to authenticated
  using (
    (select public.auth_role()) is not null
    and (user_id = (select auth.uid()) or (user_id is null and (select public.auth_role()) = 'ceo'))
  );
create policy "alerts: mark own or shared read" on public.alerts for update to authenticated
  using (
    (select public.auth_role()) is not null
    and (user_id = (select auth.uid()) or (user_id is null and (select public.auth_role()) = 'ceo'))
  )
  with check (
    (select public.auth_role()) is not null
    and (user_id = (select auth.uid()) or (user_id is null and (select public.auth_role()) = 'ceo'))
  );
create policy "alerts: ceo inserts" on public.alerts for insert to authenticated
  with check ((select public.auth_role()) = 'ceo');
create policy "alerts: ceo deletes" on public.alerts for delete to authenticated
  using ((select public.auth_role()) = 'ceo');

-- Users may only flip read_at on alerts (no editing titles or retargeting)
revoke update on public.alerts from authenticated;
grant update (read_at) on public.alerts to authenticated;

do $$
declare t text;
begin
  foreach t in array array['repayment_schedules', 'repayment_reports', 'follow_up_tasks', 'alerts', 'outbox_emails'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke truncate, references, trigger on public.%I from authenticated', t);
  end loop;
end $$;
