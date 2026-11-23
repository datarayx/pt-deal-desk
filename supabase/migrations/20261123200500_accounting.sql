-- Task 1.1 (6/8) — fees & accounting (docs/DATA_MODEL.md, docs/ACCOUNTING.md "Posting rules").
-- Accountant: read/write accounts, journal_entries, journal_lines, periods; read deal_fees
-- (status changes come through receipt/payment functions in task 3.3). CEO: everything.
--
-- Enforced here, not in the app:
--   * every POSTED journal balances (≥ 2 lines, Σdebit = Σcredit > 0) — deferred to commit
--   * each line is one-sided (debit xor credit, never negative)
--   * nothing is posted, edited or deleted in a locked period
--   * posted system entries (fee/receipt/payment/expense) are immutable — reverse them instead
--   * system accounts can't be deleted, deactivated or have their code/type changed

-- ---------------------------------------------------------------------------
-- Chart of accounts
-- ---------------------------------------------------------------------------
create table public.accounts (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[0-9]{4}$'),
  name        text not null check (char_length(name) between 1 and 160),
  type        public.account_type not null,
  subtype     text check (char_length(subtype) <= 60),
  parent_id   uuid references public.accounts (id) on delete set null,
  is_system   boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  created_by  uuid default auth.uid() references auth.users (id) on delete set null,
  constraint accounts_not_own_parent check (parent_id is distinct from id)
);
create index accounts_parent_idx on public.accounts (parent_id);
create index accounts_type_idx on public.accounts (type, code);
create index accounts_created_by_idx on public.accounts (created_by);

create or replace function public.accounts_guard_system()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_system then
    if tg_op = 'DELETE' then
      raise exception 'Account % is a system account and cannot be deleted', old.code using errcode = '42501';
    end if;
    if new.code <> old.code or new.type <> old.type or not new.is_system or not new.is_active then
      raise exception 'Account % is a system account: its code, type and status are locked', old.code
        using errcode = '42501';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;
create trigger accounts_guard_system before update or delete on public.accounts
  for each row execute function public.accounts_guard_system();

-- ---------------------------------------------------------------------------
-- Periods (YYYY-MM). A missing row means the period is open.
-- ---------------------------------------------------------------------------
create table public.periods (
  id          uuid primary key default gen_random_uuid(),
  period      text not null unique check (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  is_locked   boolean not null default false,
  locked_at   timestamptz,
  locked_by   uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  created_by  uuid default auth.uid() references auth.users (id) on delete set null,
  constraint periods_locked_has_when check (not is_locked or locked_at is not null)
);
create index periods_locked_by_idx on public.periods (locked_by);
create index periods_created_by_idx on public.periods (created_by);

create or replace function public.is_period_locked(p_period text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_locked from public.periods where period = p_period), false)
$$;
revoke all on function public.is_period_locked(text) from public, anon;
grant execute on function public.is_period_locked(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Journals
-- ---------------------------------------------------------------------------
create table public.journal_entries (
  id                 uuid primary key default gen_random_uuid(),
  entry_date         date not null,
  reference          text check (char_length(reference) <= 60),
  memo               text check (char_length(memo) <= 1000),
  source             public.journal_source not null default 'manual',
  source_id          uuid,
  posted             boolean not null default false,
  posted_at          timestamptz,
  period             text not null check (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  reverses_entry_id  uuid references public.journal_entries (id) on delete restrict,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz,
  created_by         uuid default auth.uid() references auth.users (id) on delete set null,
  constraint journal_entries_posted_has_when check (not posted or posted_at is not null),
  constraint journal_entries_not_self_reversal check (reverses_entry_id is distinct from id)
);
-- An entry can be reversed once
create unique index journal_entries_reverses_key on public.journal_entries (reverses_entry_id) where reverses_entry_id is not null;
create index journal_entries_period_idx on public.journal_entries (period, entry_date);
create index journal_entries_source_idx on public.journal_entries (source, source_id);
create index journal_entries_created_by_idx on public.journal_entries (created_by);

create table public.journal_lines (
  id           uuid primary key default gen_random_uuid(),
  entry_id     uuid not null references public.journal_entries (id) on delete cascade,
  account_id   uuid not null references public.accounts (id) on delete restrict,
  debit        numeric(18, 2) not null default 0,
  credit       numeric(18, 2) not null default 0,
  description  text check (char_length(description) <= 500),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  constraint journal_lines_one_sided check (
    (debit > 0 and credit = 0) or (credit > 0 and debit = 0)
  )
);
create index journal_lines_entry_idx on public.journal_lines (entry_id);
create index journal_lines_account_idx on public.journal_lines (account_id);
create index journal_lines_created_by_idx on public.journal_lines (created_by);

-- period is always derived from entry_date (triggers fire in name order: 10 before 20)
create or replace function public.journal_entries_set_period()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.period := to_char(new.entry_date, 'YYYY-MM');
  if new.posted and new.posted_at is null then
    new.posted_at := now();
  end if;
  return new;
end;
$$;
create trigger journal_entries_10_set_period before insert or update on public.journal_entries
  for each row execute function public.journal_entries_set_period();

-- Period lock + immutability of posted system entries
create or replace function public.journal_entries_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    if public.is_period_locked(old.period) then
      raise exception 'Period % is locked', old.period using errcode = '42501';
    end if;
    if old.posted and old.source <> 'manual' then
      raise exception 'Posted % entries cannot be changed or deleted. Post a reversal instead.', old.source
        using errcode = '42501';
    end if;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and public.is_period_locked(new.period) then
    raise exception 'Period % is locked', new.period using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger journal_entries_20_guard before insert or update or delete on public.journal_entries
  for each row execute function public.journal_entries_guard();

create or replace function public.journal_lines_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  e record;
  ids uuid[] := array_remove(array[
    case when tg_op <> 'INSERT' then old.entry_id end,
    case when tg_op <> 'DELETE' then new.entry_id end
  ], null);
begin
  for e in select je.period, je.posted, je.source from public.journal_entries je where je.id = any (ids) loop
    if public.is_period_locked(e.period) then
      raise exception 'Period % is locked', e.period using errcode = '42501';
    end if;
    if e.posted and e.source <> 'manual' then
      raise exception 'Posted % entries cannot be changed. Post a reversal instead.', e.source
        using errcode = '42501';
    end if;
  end loop;
  return coalesce(new, old);
end;
$$;
create trigger journal_lines_guard before insert or update or delete on public.journal_lines
  for each row execute function public.journal_lines_guard();

-- Balanced-journal rule, checked at COMMIT so lines can be added one by one in a transaction
create or replace function public.check_journal_balanced()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_entry uuid := case when tg_table_name = 'journal_entries' then new.id
                       else coalesce(new.entry_id, old.entry_id) end;
  v_posted boolean;
  v_lines integer;
  v_debit numeric;
  v_credit numeric;
begin
  select posted into v_posted from public.journal_entries where id = v_entry;
  if not found or not v_posted then
    return null; -- drafts may be unbalanced; deleted entries need no check
  end if;

  select count(*), coalesce(sum(debit), 0), coalesce(sum(credit), 0)
    into v_lines, v_debit, v_credit
  from public.journal_lines where entry_id = v_entry;

  if v_lines < 2 or v_debit <> v_credit or v_debit = 0 then
    raise exception 'Journal entry does not balance: debits % vs credits % across % line(s)',
      v_debit, v_credit, v_lines
      using errcode = '23514';
  end if;
  return null;
end;
$$;
create constraint trigger journal_lines_balanced
  after insert or update or delete on public.journal_lines
  deferrable initially deferred
  for each row execute function public.check_journal_balanced();
create constraint trigger journal_entries_balanced
  after insert or update of posted on public.journal_entries
  deferrable initially deferred
  for each row execute function public.check_journal_balanced();

-- ---------------------------------------------------------------------------
-- Deal fees (P&T's commissions/fees and referral fees owed)
-- ---------------------------------------------------------------------------
create table public.deal_fees (
  id                uuid primary key default gen_random_uuid(),
  deal_id           uuid not null references public.deals (id) on delete restrict,
  fee_kind          public.fee_kind not null,
  basis             public.fee_basis not null,
  value             numeric(18, 4) not null check (value >= 0),
  base_amount       numeric(18, 2) check (base_amount >= 0),
  computed_amount   numeric(18, 2) check (computed_amount >= 0),
  trigger           public.fee_trigger not null,
  status            public.fee_status not null default 'pending',
  vat_amount        numeric(18, 2) not null default 0 check (vat_amount >= 0),
  wht_amount        numeric(18, 2) not null default 0 check (wht_amount >= 0),
  earned_at         timestamptz,
  journal_entry_id  uuid references public.journal_entries (id) on delete restrict,
  idempotency_key   text unique check (char_length(idempotency_key) <= 200),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz,
  created_by        uuid default auth.uid() references auth.users (id) on delete set null,
  constraint deal_fees_percent_max check (basis <> 'percent' or value <= 100),
  constraint deal_fees_earned_recorded check (
    status in ('pending', 'cancelled')
    or (earned_at is not null and computed_amount is not null and journal_entry_id is not null)
  )
);
-- One live fee of each kind per deal (a cancelled fee can be replaced)
create unique index deal_fees_kind_per_deal on public.deal_fees (deal_id, fee_kind) where status <> 'cancelled';
create index deal_fees_status_idx on public.deal_fees (status);
create index deal_fees_journal_idx on public.deal_fees (journal_entry_id);
create index deal_fees_created_by_idx on public.deal_fees (created_by);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['accounts', 'periods', 'journal_entries', 'journal_lines'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.auth_role()) in (''ceo'', ''accountant'')) with check ((select public.auth_role()) in (''ceo'', ''accountant''))',
      t || ': ceo and accountant all', t);
  end loop;
end $$;

alter table public.deal_fees enable row level security;
create policy "deal_fees: ceo and accountant read" on public.deal_fees for select to authenticated
  using ((select public.auth_role()) in ('ceo', 'accountant'));
create policy "deal_fees: ceo inserts" on public.deal_fees for insert to authenticated
  with check ((select public.auth_role()) = 'ceo');
create policy "deal_fees: ceo updates" on public.deal_fees for update to authenticated
  using ((select public.auth_role()) = 'ceo') with check ((select public.auth_role()) = 'ceo');
create policy "deal_fees: ceo deletes" on public.deal_fees for delete to authenticated
  using ((select public.auth_role()) = 'ceo');

do $$
declare t text;
begin
  foreach t in array array['accounts', 'periods', 'journal_entries', 'journal_lines', 'deal_fees'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke truncate, references, trigger on public.%I from authenticated', t);
  end loop;
end $$;
