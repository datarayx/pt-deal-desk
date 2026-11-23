-- Task 1.1 (3/8) — clients & KYC (docs/DATA_MODEL.md "Clients & KYC").
-- CEO only: the accountant has no access to client details, KYC, directors, documents,
-- credit checks or exposures (docs/SECURITY.md). Nigerian formats enforced in the database
-- as a backstop to form validation: +234 phones, 11-digit BVN/NIN, CAC RC/BN/IT numbers.

create table public.clients (
  id              uuid primary key default gen_random_uuid(),
  client_type     public.client_type not null,
  display_name    text not null check (char_length(display_name) between 1 and 200),
  sector          text check (char_length(sector) <= 120),
  enquiry_source  public.enquiry_source not null,
  referrer_id     uuid references public.referrers (id) on delete set null,
  kyc_status      public.kyc_status not null default 'incomplete',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  created_by      uuid default auth.uid() references auth.users (id) on delete set null,
  constraint clients_referral_has_referrer check (enquiry_source <> 'referral' or referrer_id is not null)
);
create index clients_referrer_idx on public.clients (referrer_id);
create index clients_kyc_status_idx on public.clients (kyc_status);
create index clients_type_idx on public.clients (client_type);
create index clients_display_name_idx on public.clients (lower(display_name));
create index clients_created_by_idx on public.clients (created_by);

-- A person: the individual client, or a director/shareholder of a company (client_id null).
create table public.individual_profiles (
  id                        uuid primary key default gen_random_uuid(),
  client_id                 uuid references public.clients (id) on delete cascade,
  title                     text check (char_length(title) <= 20),
  first_name                text not null check (char_length(first_name) between 1 and 80),
  middle_name               text check (char_length(middle_name) <= 80),
  last_name                 text not null check (char_length(last_name) between 1 and 80),
  gender                    public.gender,
  date_of_birth             date check (date_of_birth > date '1900-01-01'),
  phone                     text check (phone ~ '^\+234[0-9]{10}$'),
  email                     text check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  residential_address       text,
  state                     text check (char_length(state) <= 60),
  lga                       text check (char_length(lga) <= 80),
  occupation                text check (char_length(occupation) <= 120),
  employer_or_business      text check (char_length(employer_or_business) <= 200),
  monthly_income_range      text check (char_length(monthly_income_range) <= 60),
  bvn                       text check (bvn ~ '^[0-9]{11}$'),
  nin                       text check (nin ~ '^[0-9]{11}$'),
  id_type                   text check (char_length(id_type) <= 60),
  id_number                 text check (char_length(id_number) <= 60),
  id_expiry                 date,
  next_of_kin_name          text check (char_length(next_of_kin_name) <= 160),
  next_of_kin_phone         text check (next_of_kin_phone ~ '^\+234[0-9]{10}$'),
  next_of_kin_relationship  text check (char_length(next_of_kin_relationship) <= 60),
  is_pep                    boolean not null default false,
  consent_given_at          timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz,
  created_by                uuid default auth.uid() references auth.users (id) on delete set null
);
-- One primary person per individual client; one record per real person (dedupe directors)
create unique index individual_profiles_client_key on public.individual_profiles (client_id) where client_id is not null;
create unique index individual_profiles_bvn_key on public.individual_profiles (bvn) where bvn is not null;
create unique index individual_profiles_nin_key on public.individual_profiles (nin) where nin is not null;
create index individual_profiles_name_idx on public.individual_profiles (lower(last_name), lower(first_name));
create index individual_profiles_created_by_idx on public.individual_profiles (created_by);

create table public.company_profiles (
  id                     uuid primary key default gen_random_uuid(),
  client_id              uuid not null unique references public.clients (id) on delete cascade,
  registered_name        text not null check (char_length(registered_name) between 1 and 200),
  rc_number              text check (rc_number ~ '^(RC|BN|IT) ?[0-9]{1,8}$'),
  incorporation_date     date check (incorporation_date > date '1900-01-01'),
  company_type           public.company_type not null,
  registered_address     text,
  operating_address      text,
  tin                    text check (char_length(tin) between 8 and 20),
  sector                 text check (char_length(sector) <= 120),
  annual_turnover_range  text check (char_length(annual_turnover_range) <= 60),
  website                text check (char_length(website) <= 200),
  contact_person         text check (char_length(contact_person) <= 160),
  contact_phone          text check (contact_phone ~ '^\+234[0-9]{10}$'),
  contact_email          text check (contact_email = lower(contact_email) and contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz,
  created_by             uuid default auth.uid() references auth.users (id) on delete set null
);
create unique index company_profiles_rc_number_key on public.company_profiles (rc_number) where rc_number is not null;
create index company_profiles_created_by_idx on public.company_profiles (created_by);

create table public.company_directors (
  id                     uuid primary key default gen_random_uuid(),
  company_client_id      uuid not null references public.clients (id) on delete cascade,
  individual_profile_id  uuid not null references public.individual_profiles (id) on delete cascade,
  role                   public.director_role not null,
  shareholding_pct       numeric(5, 2) check (shareholding_pct between 0 and 100),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz,
  created_by             uuid default auth.uid() references auth.users (id) on delete set null,
  constraint company_directors_pair_key unique (company_client_id, individual_profile_id),
  constraint company_directors_shareholder_pct check (role = 'director' or shareholding_pct is not null)
);
create index company_directors_individual_idx on public.company_directors (individual_profile_id);
create index company_directors_created_by_idx on public.company_directors (created_by);

-- Configurable checklist per client type (Settings → KYC checklists)
create table public.kyc_document_types (
  id           uuid primary key default gen_random_uuid(),
  client_type  public.client_type not null,
  name         text not null check (char_length(name) between 1 and 160),
  is_required  boolean not null default true,
  has_expiry   boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  constraint kyc_document_types_name_key unique (client_type, name)
);
create index kyc_document_types_order_idx on public.kyc_document_types (client_type, sort_order);
create index kyc_document_types_created_by_idx on public.kyc_document_types (created_by);

create table public.client_documents (
  id                     uuid primary key default gen_random_uuid(),
  client_id              uuid not null references public.clients (id) on delete cascade,
  individual_profile_id  uuid references public.individual_profiles (id) on delete cascade,
  document_type_id       uuid not null references public.kyc_document_types (id) on delete restrict,
  file_path              text check (file_path ~ '^[A-Za-z0-9/_.\-]+$'),
  status                 public.document_status not null default 'missing',
  expiry_date            date,
  verified_by            uuid references auth.users (id) on delete set null,
  verified_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz,
  created_by             uuid default auth.uid() references auth.users (id) on delete set null,
  constraint client_documents_verified_has_when check (status <> 'verified' or (verified_at is not null and verified_by is not null)),
  constraint client_documents_file_when_received check (status = 'missing' or file_path is not null)
);
-- One record per checklist item per person (re-uploads replace the file)
create unique index client_documents_item_key
  on public.client_documents (client_id, individual_profile_id, document_type_id) nulls not distinct;
create index client_documents_individual_idx on public.client_documents (individual_profile_id);
create index client_documents_type_idx on public.client_documents (document_type_id);
create index client_documents_expiry_idx on public.client_documents (expiry_date) where expiry_date is not null;
create index client_documents_verified_by_idx on public.client_documents (verified_by);
create index client_documents_created_by_idx on public.client_documents (created_by);

create table public.credit_checks (
  id                     uuid primary key default gen_random_uuid(),
  client_id              uuid not null references public.clients (id) on delete cascade,
  bureau                 public.credit_bureau not null,
  check_date             date not null,
  rating                 text check (char_length(rating) <= 40),
  score                  integer check (score between 0 and 1000),
  total_exposure         numeric(18, 2) check (total_exposure >= 0),
  delinquent_facilities  integer not null default 0 check (delinquent_facilities >= 0),
  remarks                text,
  report_file_path       text check (report_file_path ~ '^[A-Za-z0-9/_.\-]+$'),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz,
  created_by             uuid default auth.uid() references auth.users (id) on delete set null
);
create index credit_checks_client_date_idx on public.credit_checks (client_id, check_date desc);
create index credit_checks_created_by_idx on public.credit_checks (created_by);

create table public.external_exposures (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients (id) on delete cascade,
  lender_name    text not null check (char_length(lender_name) between 1 and 160),
  facility_type  text check (char_length(facility_type) <= 120),
  amount         numeric(18, 2) not null check (amount >= 0),
  outstanding    numeric(18, 2) not null check (outstanding >= 0),
  status         public.exposure_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz,
  created_by     uuid default auth.uid() references auth.users (id) on delete set null
);
create index external_exposures_client_idx on public.external_exposures (client_id);
create index external_exposures_created_by_idx on public.external_exposures (created_by);

-- RLS: CEO only on every table here ---------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['clients', 'individual_profiles', 'company_profiles', 'company_directors',
                           'kyc_document_types', 'client_documents', 'credit_checks', 'external_exposures'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.auth_role()) = ''ceo'') with check ((select public.auth_role()) = ''ceo'')',
      t || ': ceo all', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke truncate, references, trigger on public.%I from authenticated', t);
  end loop;
end $$;
