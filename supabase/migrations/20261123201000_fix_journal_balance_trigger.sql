-- Fix check_journal_balanced(): the first version referenced new.entry_id in a CASE expression
-- even when fired from journal_entries (which has no entry_id), so PL/pgSQL raised
-- 'record "new" has no field "entry_id"' on every journal entry insert/post. Found by the
-- behaviour tests before any app code used it.
-- Now resolves the entry per table, and when a line is moved between entries checks both.

create or replace function public.check_journal_balanced()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_entries uuid[];
  v_entry uuid;
  v_posted boolean;
  v_lines integer;
  v_debit numeric;
  v_credit numeric;
begin
  if tg_table_name = 'journal_entries' then
    v_entries := array[new.id];
  elsif tg_op = 'INSERT' then
    v_entries := array[new.entry_id];
  elsif tg_op = 'DELETE' then
    v_entries := array[old.entry_id];
  else
    v_entries := array_remove(array[old.entry_id, case when new.entry_id <> old.entry_id then new.entry_id end], null);
  end if;

  foreach v_entry in array v_entries loop
    select posted into v_posted from public.journal_entries where id = v_entry;
    continue when not found or not v_posted; -- drafts may be unbalanced; deleted entries need no check

    select count(*), coalesce(sum(debit), 0), coalesce(sum(credit), 0)
      into v_lines, v_debit, v_credit
    from public.journal_lines where entry_id = v_entry;

    if v_lines < 2 or v_debit <> v_credit or v_debit = 0 then
      raise exception 'Journal entry does not balance: debits % vs credits % across % line(s)',
        v_debit, v_credit, v_lines
        using errcode = '23514';
    end if;
  end loop;
  return null;
end;
$$;
