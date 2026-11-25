-- Bulk data migration support: staged workbooks are validated before a caller commits them.
-- Operational domains are CEO-only; the Accountant may stage and manage accounting imports.

create table public.import_batches (
  id           uuid primary key default gen_random_uuid(),
  domain       text not null check (domain in ('partners', 'clients', 'deals', 'repayments', 'accounting')),
  mode         text not null check (mode in ('historical', 'live')),
  source_name  text not null check (char_length(source_name) between 1 and 255),
  status       text not null default 'staged' check (status in ('staged', 'committing', 'committed', 'failed', 'cancelled')),
  row_count    integer not null default 0 check (row_count >= 0),
  error_count  integer not null default 0 check (error_count >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,
  committed_at timestamptz,
  created_by   uuid not null default auth.uid() references auth.users (id) on delete restrict
);

create table public.import_rows (
  id          uuid primary key default gen_random_uuid(),
  batch_id    uuid not null references public.import_batches (id) on delete cascade,
  sheet_name  text not null check (sheet_name ~ '^[a-z][a-z0-9_]{0,60}$'),
  row_number  integer not null check (row_number >= 2),
  payload     jsonb not null,
  status      text not null default 'valid' check (status in ('valid', 'invalid', 'committed', 'failed')),
  errors      jsonb not null default '[]'::jsonb,
  target_id   uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  unique (batch_id, sheet_name, row_number)
);

-- Stable source IDs let later workbooks refer to records created by an earlier batch without
-- exposing or requiring Supabase UUIDs in the source system.
create table public.import_entity_refs (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('referrer', 'financier', 'client', 'deal')),
  external_id text not null check (char_length(external_id) between 1 and 120),
  entity_id   uuid not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  created_by  uuid not null default auth.uid() references auth.users (id) on delete restrict,
  unique (entity_type, external_id)
);

create index import_batches_created_by_idx on public.import_batches (created_by, created_at desc);
create index import_batches_domain_idx on public.import_batches (domain, status, created_at desc);
create index import_rows_batch_idx on public.import_rows (batch_id, sheet_name, row_number);
create index import_entity_refs_lookup_idx on public.import_entity_refs (entity_type, external_id);

alter table public.import_batches enable row level security;
alter table public.import_rows enable row level security;
alter table public.import_entity_refs enable row level security;

create policy "import_batches: role-scoped access" on public.import_batches for all to authenticated
  using (
    created_by = (select auth.uid())
    and (
      (domain = 'accounting' and (select public.auth_role()) in ('ceo', 'accountant'))
      or (domain <> 'accounting' and (select public.auth_role()) = 'ceo')
    )
  )
  with check (
    created_by = (select auth.uid())
    and (
      (domain = 'accounting' and (select public.auth_role()) in ('ceo', 'accountant'))
      or (domain <> 'accounting' and (select public.auth_role()) = 'ceo')
    )
  );

create policy "import_rows: through owned batch" on public.import_rows for all to authenticated
  using (
    exists (
      select 1 from public.import_batches b
      where b.id = import_rows.batch_id
    )
  )
  with check (
    exists (
      select 1 from public.import_batches b
      where b.id = import_rows.batch_id
    )
  );

create policy "import_entity_refs: role-scoped access" on public.import_entity_refs for all to authenticated
  using ((select public.auth_role()) in ('ceo', 'accountant') and created_by = (select auth.uid()))
  with check ((select public.auth_role()) in ('ceo', 'accountant') and created_by = (select auth.uid()));

revoke all on public.import_batches, public.import_rows, public.import_entity_refs from anon;
revoke truncate, references, trigger on public.import_batches, public.import_rows, public.import_entity_refs from authenticated;

create trigger import_batches_set_updated_at before update on public.import_batches
  for each row execute function public.set_updated_at();
create trigger import_rows_set_updated_at before update on public.import_rows
  for each row execute function public.set_updated_at();
create trigger import_entity_refs_set_updated_at before update on public.import_entity_refs
  for each row execute function public.set_updated_at();

create or replace function public.stage_import_batch(
  p_domain text,
  p_mode text,
  p_source_name text,
  p_rows jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_batch_id uuid;
begin
  if p_domain not in ('partners', 'clients', 'deals', 'repayments', 'accounting') then
    raise exception 'Unsupported import domain' using errcode = '22023';
  end if;
  if p_mode not in ('historical', 'live') then
    raise exception 'Unsupported import mode' using errcode = '22023';
  end if;
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Import rows must be an array' using errcode = '22023';
  end if;

  insert into public.import_batches (domain, mode, source_name, row_count, error_count)
  values (
    p_domain,
    p_mode,
    left(p_source_name, 255),
    jsonb_array_length(p_rows),
    (select count(*) from jsonb_array_elements(p_rows) row_data where jsonb_array_length(coalesce(row_data->'errors', '[]'::jsonb)) > 0)
  )
  returning id into v_batch_id;

  insert into public.import_rows (batch_id, sheet_name, row_number, payload, status, errors)
  select
    v_batch_id,
    left(row_data->>'sheet', 61),
    greatest(2, coalesce((row_data->>'row')::integer, 2)),
    coalesce(row_data->'payload', '{}'::jsonb),
    case when jsonb_array_length(coalesce(row_data->'errors', '[]'::jsonb)) > 0 then 'invalid' else 'valid' end,
    coalesce(row_data->'errors', '[]'::jsonb)
  from jsonb_array_elements(p_rows) row_data;

  return v_batch_id;
end;
$$;

create or replace function public.read_import_batch(p_batch_id uuid)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'batch', to_jsonb(b),
    'rows', coalesce(
      (select jsonb_agg(to_jsonb(r) order by r.sheet_name, r.row_number) from public.import_rows r where r.batch_id = b.id),
      '[]'::jsonb
    )
  )
  from public.import_batches b
  where b.id = p_batch_id;
$$;

create or replace function public.finish_import_batch(p_batch_id uuid, p_status text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_status not in ('committing', 'committed', 'failed', 'cancelled') then
    raise exception 'Unsupported import status' using errcode = '22023';
  end if;
  update public.import_batches
  set status = p_status,
      committed_at = case when p_status = 'committed' then now() else committed_at end
  where id = p_batch_id;
  if not found then raise exception 'Import batch not found' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.save_import_ref(
  p_entity_type text,
  p_external_id text,
  p_entity_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.import_entity_refs (entity_type, external_id, entity_id)
  values (p_entity_type, p_external_id, p_entity_id)
  on conflict (entity_type, external_id) do update
    set entity_id = excluded.entity_id, updated_at = now();
end;
$$;

create or replace function public.read_import_refs(p_entity_type text, p_external_ids text[])
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select coalesce(jsonb_object_agg(external_id, entity_id), '{}'::jsonb)
  from public.import_entity_refs
  where entity_type = p_entity_type and external_id = any(p_external_ids);
$$;

revoke all on function public.stage_import_batch(text, text, text, jsonb) from public, anon;
revoke all on function public.read_import_batch(uuid) from public, anon;
revoke all on function public.finish_import_batch(uuid, text) from public, anon;
revoke all on function public.save_import_ref(text, text, uuid) from public, anon;
revoke all on function public.read_import_refs(text, text[]) from public, anon;
grant execute on function public.stage_import_batch(text, text, text, jsonb) to authenticated;
grant execute on function public.read_import_batch(uuid) to authenticated;
grant execute on function public.finish_import_batch(uuid, text) to authenticated;
grant execute on function public.save_import_ref(text, text, uuid) to authenticated;
grant execute on function public.read_import_refs(text, text[]) to authenticated;

