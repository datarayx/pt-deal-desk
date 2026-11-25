-- Prevent imports from being committed twice and keep staged row state truthful.
create or replace function public.finish_import_batch(p_batch_id uuid, p_status text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_current text;
begin
  if p_status not in ('committing', 'committed', 'failed', 'cancelled') then
    raise exception 'Unsupported import status' using errcode = '22023';
  end if;
  select status into v_current from public.import_batches where id = p_batch_id for update;
  if not found then raise exception 'Import batch not found' using errcode = 'P0002'; end if;
  if p_status = 'committing' and v_current <> 'staged' then
    raise exception 'Only a staged import can start committing' using errcode = '55000';
  end if;
  if p_status in ('committed', 'failed') and v_current <> 'committing' then
    raise exception 'Only a committing import can be finished' using errcode = '55000';
  end if;
  if p_status = 'cancelled' and v_current <> 'staged' then
    raise exception 'Only a staged import can be cancelled' using errcode = '55000';
  end if;
  update public.import_batches
  set status = p_status,
      committed_at = case when p_status = 'committed' then now() else committed_at end,
      error_count = case when p_status = 'failed' then greatest(error_count, 1) else error_count end
  where id = p_batch_id;
  update public.import_rows
  set status = case when p_status = 'committed' then 'committed' when p_status = 'failed' then 'failed' else status end
  where batch_id = p_batch_id and status = 'valid';
end;
$$;

