-- Task 1.1 (4/8) — deals (docs/DATA_MODEL.md "Deals", docs/WORKFLOWS.md §2). CEO only.

create table public.deal_stages (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique check (char_length(name) between 1 and 80),
  sort_order   integer not null,
  is_terminal  boolean not null default false,
  color        text check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null
);
create index deal_stages_order_idx on public.deal_stages (sort_order);
create index deal_stages_created_by_idx on public.deal_stages (created_by);

create table public.facility_types (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 1 and 80),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  created_by  uuid default auth.uid() references auth.users (id) on delete set null
);
create index facility_types_created_by_idx on public.facility_types (created_by);

create table public.deals (
  id                     uuid primary key default gen_random_uuid(),
  reference              text not null unique check (reference ~ '^PT-[0-9]{4}-[0-9]{4,}$'),
  client_id              uuid not null references public.clients (id) on delete restrict,
  financier_id           uuid references public.financiers (id) on delete restrict,
  referrer_id            uuid references public.referrers (id) on delete set null,
  facility_type_id       uuid references public.facility_types (id) on delete restrict,
  stage_id               uuid not null references public.deal_stages (id) on delete restrict,
  stage_entered_at       timestamptz not null default now(),
  outcome                public.deal_outcome not null default 'open',
  amount_requested       numeric(18, 2) check (amount_requested > 0),
  amount_approved        numeric(18, 2) check (amount_approved > 0),
  amount_disbursed       numeric(18, 2) check (amount_disbursed > 0),
  tenor_months           integer check (tenor_months between 1 and 120),
  interest_rate_monthly  numeric(6, 3) check (interest_rate_monthly between 0 and 100),
  purpose                text,
  collateral_type        text check (char_length(collateral_type) <= 160),
  collateral_value       numeric(18, 2) check (collateral_value >= 0),
  guarantor_name         text check (char_length(guarantor_name) <= 160),
  guarantor_cheques      boolean not null default false,
  other_fees_note        text,
  offer_date             date,
  disbursement_date      date,
  first_repayment_date   date,
  maturity_date          date,
  repayment_frequency    public.repayment_frequency,
  decline_reason         text,
  owner_id               uuid references auth.users (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz,
  created_by             uuid default auth.uid() references auth.users (id) on delete set null,
  -- WORKFLOWS.md §2: a reason is mandatory for declined and negotiating outcomes
  constraint deals_side_outcome_reason check (
    outcome not in ('declined_by_lender', 'declined_by_client', 'negotiating')
    or nullif(btrim(decline_reason), '') is not null
  ),
  constraint deals_disbursement_pair check ((amount_disbursed is null) = (disbursement_date is null)),
  constraint deals_repayment_dates_order check (
    (first_repayment_date is null or disbursement_date is null or first_repayment_date >= disbursement_date)
    and (maturity_date is null or first_repayment_date is null or maturity_date >= first_repayment_date)
  )
);
create index deals_client_idx on public.deals (client_id);
create index deals_financier_idx on public.deals (financier_id);
create index deals_referrer_idx on public.deals (referrer_id);
create index deals_facility_type_idx on public.deals (facility_type_id);
create index deals_stage_idx on public.deals (stage_id, stage_entered_at);
create index deals_outcome_idx on public.deals (outcome);
create index deals_owner_idx on public.deals (owner_id);
create index deals_created_by_idx on public.deals (created_by);

-- Keep stage_entered_at honest (drives the 30-day stale rule)
create or replace function public.deals_track_stage()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.stage_id is distinct from old.stage_id then
    new.stage_entered_at := now();
  end if;
  return new;
end;
$$;
create trigger deals_track_stage before update of stage_id on public.deals
  for each row execute function public.deals_track_stage();

create table public.deal_requirements (
  id           uuid primary key default gen_random_uuid(),
  deal_id      uuid not null references public.deals (id) on delete cascade,
  item         text not null check (char_length(item) between 1 and 240),
  is_required  boolean not null default true,
  sort_order   integer not null default 0,
  status       public.requirement_status not null default 'pending',
  file_path    text check (file_path ~ '^[A-Za-z0-9/_.\-]+$'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  constraint deal_requirements_item_key unique (deal_id, item)
);
create index deal_requirements_deficiency_idx on public.deal_requirements (deal_id) where status = 'pending' and is_required;
create index deal_requirements_created_by_idx on public.deal_requirements (created_by);

create table public.deal_stage_history (
  id             uuid primary key default gen_random_uuid(),
  deal_id        uuid not null references public.deals (id) on delete cascade,
  from_stage_id  uuid references public.deal_stages (id) on delete restrict,
  to_stage_id    uuid not null references public.deal_stages (id) on delete restrict,
  changed_at     timestamptz not null default now(),
  changed_by     uuid default auth.uid() references auth.users (id) on delete set null,
  note           text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz,
  created_by     uuid default auth.uid() references auth.users (id) on delete set null
);
create index deal_stage_history_deal_idx on public.deal_stage_history (deal_id, changed_at desc);
create index deal_stage_history_from_idx on public.deal_stage_history (from_stage_id);
create index deal_stage_history_to_idx on public.deal_stage_history (to_stage_id);
create index deal_stage_history_changed_by_idx on public.deal_stage_history (changed_by);
create index deal_stage_history_created_by_idx on public.deal_stage_history (created_by);

create table public.deal_documents (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references public.deals (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  file_path   text not null check (file_path ~ '^[A-Za-z0-9/_.\-]+$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  created_by  uuid default auth.uid() references auth.users (id) on delete set null
);
create index deal_documents_deal_idx on public.deal_documents (deal_id);
create index deal_documents_created_by_idx on public.deal_documents (created_by);

-- Timeline for clients, deals and referrers (polymorphic: entity_type + entity_id)
create table public.activities (
  id           uuid primary key default gen_random_uuid(),
  entity_type  public.activity_entity not null,
  entity_id    uuid not null,
  kind         public.activity_kind not null,
  body         text not null check (char_length(body) between 1 and 10000),
  occurred_at  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null
);
create index activities_entity_idx on public.activities (entity_type, entity_id, occurred_at desc);
create index activities_created_by_idx on public.activities (created_by);

-- RLS: CEO only on every table here ---------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['deal_stages', 'facility_types', 'deals', 'deal_requirements',
                           'deal_stage_history', 'deal_documents', 'activities'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.auth_role()) = ''ceo'') with check ((select public.auth_role()) = ''ceo'')',
      t || ': ceo all', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke truncate, references, trigger on public.%I from authenticated', t);
  end loop;
end $$;
