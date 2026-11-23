-- Task 1.1 (7/8) — platform tables: audit_log, saved_views, reminder_log.

-- ---------------------------------------------------------------------------
-- audit_log (SECURITY.md, NDPA): append-only record of KYC views and changes.
-- Any signed-in user may write entries as themselves; only the CEO reads them; nobody edits
-- or deletes them.
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid default auth.uid() references auth.users (id) on delete set null,
  action       public.audit_action not null,
  entity_type  text not null check (entity_type ~ '^[a-z_]{1,60}$'),
  entity_id    uuid,
  before       jsonb,
  after        jsonb,
  at           timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id, at desc);
create index audit_log_actor_idx on public.audit_log (actor_id, at desc);
create index audit_log_at_idx on public.audit_log (at desc);

alter table public.audit_log enable row level security;
create policy "audit_log: write own entries" on public.audit_log for insert to authenticated
  with check ((select public.auth_role()) is not null and actor_id = (select auth.uid()));
create policy "audit_log: ceo reads" on public.audit_log for select to authenticated
  using ((select public.auth_role()) = 'ceo');
revoke all on public.audit_log from anon;
revoke update, delete, truncate, references, trigger on public.audit_log from authenticated;

-- ---------------------------------------------------------------------------
-- saved_views: per-user saved table filters (DESIGN.md §5)
-- ---------------------------------------------------------------------------
create table public.saved_views (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  table_key   text not null check (table_key ~ '^[a-z][a-z0-9_.-]{0,60}$'),
  name        text not null check (char_length(name) between 1 and 80),
  filters     jsonb not null default '{}',
  columns     jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  created_by  uuid default auth.uid() references auth.users (id) on delete set null,
  constraint saved_views_name_key unique (user_id, table_key, name)
);
create index saved_views_created_by_idx on public.saved_views (created_by);

alter table public.saved_views enable row level security;
create policy "saved_views: own only" on public.saved_views for all to authenticated
  using ((select public.auth_role()) is not null and user_id = (select auth.uid()))
  with check ((select public.auth_role()) is not null and user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- reminder_log: one row per (instalment|deal, condition, channel, Lagos day) — the unique key
-- is what makes "never send duplicates" (WORKFLOWS.md §5) true. Written by the daily job.
-- ---------------------------------------------------------------------------
create table public.reminder_log (
  id           uuid primary key default gen_random_uuid(),
  schedule_id  uuid references public.repayment_schedules (id) on delete cascade,
  deal_id      uuid references public.deals (id) on delete cascade,
  condition    public.reminder_condition not null,
  channel      public.reminder_channel not null,
  sent_on      date not null default (now() at time zone 'Africa/Lagos')::date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  constraint reminder_log_target check (schedule_id is not null or deal_id is not null),
  constraint reminder_log_once_per_day unique nulls not distinct (schedule_id, deal_id, condition, channel, sent_on)
);
create index reminder_log_deal_idx on public.reminder_log (deal_id);
create index reminder_log_sent_on_idx on public.reminder_log (sent_on);
create index reminder_log_created_by_idx on public.reminder_log (created_by);

alter table public.reminder_log enable row level security;
create policy "reminder_log: ceo all" on public.reminder_log for all to authenticated
  using ((select public.auth_role()) = 'ceo') with check ((select public.auth_role()) = 'ceo');

do $$
declare t text;
begin
  foreach t in array array['saved_views', 'reminder_log'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke truncate, references, trigger on public.%I from authenticated', t);
  end loop;
end $$;
