-- Tasks 0.4 / 0.5 — users, roles and the RLS helper every later policy builds on.
-- docs/DATA_MODEL.md "Users", docs/SECURITY.md "Roles enforced in the database".
--
-- Roles come from auth.users.raw_app_meta_data->>'role', which only the service-role key can set
-- (user_metadata is user-editable and is never trusted). A user created without an admin-assigned
-- role gets a profile that is INACTIVE, so an accidental public sign-up has no access at all.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('ceo', 'accountant');

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current (used by every table from here on)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text not null,
  role        public.app_role not null default 'accountant',
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  created_by  uuid references auth.users (id) on delete set null,
  constraint profiles_email_lowercase check (email = lower(email)),
  constraint profiles_full_name_length check (char_length(full_name) <= 120)
);

comment on table public.profiles is 'App users (CEO, Accountant). Role and is_active gate all access via public.auth_role().';
comment on column public.profiles.is_active is 'Inactive users are treated as signed out by auth_role(); set by the CEO.';

create unique index profiles_email_key on public.profiles (email);
create index profiles_created_by_idx on public.profiles (created_by);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- auth_role(): the caller's role, or null if signed out / no profile / inactive.
-- SECURITY DEFINER so policies on profiles can call it without recursing into RLS.
-- ---------------------------------------------------------------------------
create or replace function public.auth_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.is_active
$$;

comment on function public.auth_role() is 'Role of the signed-in, active user; null otherwise. Use in RLS policies: (select public.auth_role()) = ''ceo''.';

revoke all on function public.auth_role() from public, anon;
grant execute on function public.auth_role() to authenticated;

-- ---------------------------------------------------------------------------
-- New auth user -> profile (role only from app_metadata, set by the server)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_app_meta_data ->> 'role';
  valid_role boolean := coalesce(requested_role in ('ceo', 'accountant'), false);
begin
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(left(new.raw_user_meta_data ->> 'full_name', 120), ''),
    case when valid_role then requested_role::public.app_role else 'accountant' end,
    valid_role
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in step when a user changes their email.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = lower(new.email) where id = new.id;
  return new;
end;
$$;

revoke all on function public.handle_user_email_change() from public, anon, authenticated;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- RLS: users read their own profile; the CEO reads and manages all.
-- Nobody can change their own role or activate themselves.
-- Inserts happen only through the trigger above (security definer).
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles: ceo reads all"
  on public.profiles for select
  to authenticated
  using ((select public.auth_role()) = 'ceo');

create policy "profiles: ceo updates"
  on public.profiles for update
  to authenticated
  using ((select public.auth_role()) = 'ceo')
  with check ((select public.auth_role()) = 'ceo');

-- No insert/delete policies: profiles are created by the trigger and removed with the auth user.
revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
-- The CEO may only edit these columns (never id/email/audit columns).
grant update (full_name, role, is_active) on public.profiles to authenticated;

-- Guard: nobody changes their own role or deactivates themselves (prevents a CEO lock-out).
create or replace function public.profiles_guard_self_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id = (select auth.uid())
     and (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
    raise exception 'You cannot change your own role or active status'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_self_change
  before update on public.profiles
  for each row execute function public.profiles_guard_self_change();
