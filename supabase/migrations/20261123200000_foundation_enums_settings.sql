-- Task 1.1 (1/8) — foundation: default privileges, every enum in docs/DATA_MODEL.md, and the
-- small configuration tables (settings, notification_recipients).
--
-- Access pattern used in every migration (docs/SECURITY.md):
--   * RLS enabled + explicit policies in the same migration as the table.
--   * One permissive policy per table per action (database advisor 0006).
--   * anon gets nothing; authenticated gets only the table privileges it needs.
--   * Role checks call (select public.auth_role()) so Postgres evaluates it once per statement.

-- ---------------------------------------------------------------------------
-- Default privileges for objects created by migrations (role postgres)
-- ---------------------------------------------------------------------------
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke execute on functions from anon, public;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.alert_type as enum ('due_soon', 'due_today', 'overdue', 'stale_deal');
create type public.client_type as enum ('individual', 'company');
create type public.enquiry_source as enum ('email', 'whatsapp', 'phone', 'walk_in', 'website', 'referral');
create type public.kyc_status as enum ('incomplete', 'submitted', 'verified');
create type public.gender as enum ('male', 'female');
create type public.company_type as enum ('ltd', 'plc', 'bn', 'ngo');
create type public.director_role as enum ('director', 'shareholder', 'director_shareholder');
create type public.document_status as enum ('missing', 'received', 'verified', 'expired');
create type public.credit_bureau as enum ('CRC', 'FirstCentral', 'CreditRegistry', 'Other');
create type public.exposure_status as enum ('active', 'closed', 'delinquent');
create type public.referrer_type as enum ('consultant', 'advisory_firm', 'past_client', 'individual', 'other');
create type public.fee_basis as enum ('percent', 'flat');
create type public.financier_type as enum ('finance_house', 'bank', 'capital_markets', 'other');
create type public.deal_outcome as enum ('open', 'negotiating', 'declined_by_lender', 'declined_by_client', 'defaulted', 'completed');
create type public.repayment_frequency as enum ('monthly', 'bullet', 'quarterly');
create type public.requirement_status as enum ('pending', 'received', 'waived');
create type public.activity_entity as enum ('client', 'deal', 'referrer');
create type public.activity_kind as enum ('note', 'call', 'email', 'meeting', 'system');
create type public.instalment_status as enum ('scheduled', 'due', 'reported', 'confirmed', 'partially_paid', 'overdue');
create type public.payment_channel as enum ('receipt', 'bank_alert', 'whatsapp', 'other');
create type public.task_status as enum ('open', 'done');
create type public.alert_kind as enum ('due_soon', 'due_today', 'overdue', 'stale_deal', 'system');
create type public.outbox_status as enum ('queued', 'sent', 'demo');
create type public.reminder_condition as enum ('due_7', 'due_3', 'due_0', 'overdue', 'stale_deal');
create type public.reminder_channel as enum ('alert', 'email');
create type public.audit_action as enum ('view', 'create', 'update', 'delete', 'signed_url');
create type public.fee_kind as enum ('provider_commission', 'client_fee', 'collateral_fee', 'referral_fee');
create type public.fee_trigger as enum ('on_disbursement', 'on_first_repayment', 'manual');
create type public.fee_status as enum ('pending', 'earned', 'received', 'paid', 'cancelled');
create type public.account_type as enum ('asset', 'liability', 'equity', 'income', 'expense');
create type public.journal_source as enum ('manual', 'fee', 'receipt', 'payment', 'expense');

-- ---------------------------------------------------------------------------
-- settings: key → jsonb value (reminder days, VAT %, WHT %, company profile, …)
-- Accountant reads (needs VAT/WHT rates); CEO writes.
-- ---------------------------------------------------------------------------
create table public.settings (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  value       jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  created_by  uuid default auth.uid() references auth.users (id) on delete set null
);
create index settings_created_by_idx on public.settings (created_by);

alter table public.settings enable row level security;
create policy "settings: ceo and accountant read" on public.settings for select to authenticated
  using ((select public.auth_role()) in ('ceo', 'accountant'));
create policy "settings: ceo inserts" on public.settings for insert to authenticated
  with check ((select public.auth_role()) = 'ceo');
create policy "settings: ceo updates" on public.settings for update to authenticated
  using ((select public.auth_role()) = 'ceo') with check ((select public.auth_role()) = 'ceo');
create policy "settings: ceo deletes" on public.settings for delete to authenticated
  using ((select public.auth_role()) = 'ceo');

-- ---------------------------------------------------------------------------
-- notification_recipients: staff who get emails but don't sign in. CEO only.
-- ---------------------------------------------------------------------------
create table public.notification_recipients (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 120),
  title        text check (char_length(title) <= 120),
  email        text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  alert_types  public.alert_type[] not null default '{due_soon,due_today,overdue,stale_deal}',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  constraint notification_recipients_email_key unique (email)
);
create index notification_recipients_created_by_idx on public.notification_recipients (created_by);

alter table public.notification_recipients enable row level security;
create policy "notification_recipients: ceo all" on public.notification_recipients for all to authenticated
  using ((select public.auth_role()) = 'ceo') with check ((select public.auth_role()) = 'ceo');

-- ---------------------------------------------------------------------------
-- Shared: updated_at triggers + exact table privileges
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['settings', 'notification_recipients'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke truncate, references, trigger on public.%I from authenticated', t);
  end loop;
end $$;
