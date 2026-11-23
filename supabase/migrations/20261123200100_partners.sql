-- Task 1.1 (2/8) — partners: referrers, financiers, financier_requirements.
-- CEO only on the tables. The accountant reaches referrer name + bank details only through
-- public.finance_referrers() (SECURITY.md: "read referrer name, bank_name, account_name").

create table public.referrers (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null check (char_length(name) between 1 and 160),
  referrer_type      public.referrer_type not null,
  contact_person     text check (char_length(contact_person) <= 120),
  phone              text check (phone ~ '^\+234[0-9]{10}$'),
  email              text check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  default_fee_type   public.fee_basis,
  default_fee_value  numeric(18, 4) check (default_fee_value >= 0),
  bank_name          text check (char_length(bank_name) <= 120),
  account_name       text check (char_length(account_name) <= 160),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz,
  created_by         uuid default auth.uid() references auth.users (id) on delete set null,
  constraint referrers_default_fee_pair check ((default_fee_type is null) = (default_fee_value is null)),
  constraint referrers_default_percent_max check (default_fee_type is distinct from 'percent' or default_fee_value <= 100)
);
create index referrers_created_by_idx on public.referrers (created_by);
create index referrers_name_idx on public.referrers (lower(name));

create table public.financiers (
  id                uuid primary key default gen_random_uuid(),
  name              text not null unique check (char_length(name) between 1 and 160),
  financier_type    public.financier_type not null,
  contact_person    text check (char_length(contact_person) <= 120),
  phone             text check (phone ~ '^\+234[0-9]{10}$'),
  email             text check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  rate_min_monthly  numeric(6, 3) check (rate_min_monthly between 0 and 100),
  rate_max_monthly  numeric(6, 3) check (rate_max_monthly between 0 and 100),
  facility_types    text[] not null default '{}',
  collateral_policy text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz,
  created_by        uuid default auth.uid() references auth.users (id) on delete set null,
  constraint financiers_rate_range check (rate_min_monthly is null or rate_max_monthly is null or rate_min_monthly <= rate_max_monthly)
);
create index financiers_created_by_idx on public.financiers (created_by);

create table public.financier_requirements (
  id            uuid primary key default gen_random_uuid(),
  financier_id  uuid not null references public.financiers (id) on delete cascade,
  item          text not null check (char_length(item) between 1 and 240),
  is_required   boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz,
  created_by    uuid default auth.uid() references auth.users (id) on delete set null,
  constraint financier_requirements_item_key unique (financier_id, item)
);
create index financier_requirements_financier_idx on public.financier_requirements (financier_id, sort_order);
create index financier_requirements_created_by_idx on public.financier_requirements (created_by);

-- RLS: CEO only ---------------------------------------------------------------
alter table public.referrers enable row level security;
alter table public.financiers enable row level security;
alter table public.financier_requirements enable row level security;

create policy "referrers: ceo all" on public.referrers for all to authenticated
  using ((select public.auth_role()) = 'ceo') with check ((select public.auth_role()) = 'ceo');
create policy "financiers: ceo all" on public.financiers for all to authenticated
  using ((select public.auth_role()) = 'ceo') with check ((select public.auth_role()) = 'ceo');
create policy "financier_requirements: ceo all" on public.financier_requirements for all to authenticated
  using ((select public.auth_role()) = 'ceo') with check ((select public.auth_role()) = 'ceo');

-- Accountant-safe projection of referrers (name + where to pay them) ----------
create or replace function public.finance_referrers()
returns table (id uuid, name text, bank_name text, account_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.name, r.bank_name, r.account_name
  from public.referrers r
  where (select public.auth_role()) in ('ceo', 'accountant')
  order by r.name
$$;
comment on function public.finance_referrers() is 'Referrer name and payout details for Finance (accountant-safe). Empty for anyone else.';
revoke all on function public.finance_referrers() from public, anon;
grant execute on function public.finance_referrers() to authenticated;

do $$
declare t text;
begin
  foreach t in array array['referrers', 'financiers', 'financier_requirements'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke truncate, references, trigger on public.%I from authenticated', t);
  end loop;
end $$;
