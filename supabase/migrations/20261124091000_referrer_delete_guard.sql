-- Task 2.3 — a referrer with clients or deals can't be deleted.
-- clients.referrer_id and deals.referrer_id are ON DELETE SET NULL, so deleting such a referrer
-- would silently lose who introduced the client and who is owed the referral fee.

create or replace function public.referrers_guard_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.deals d where d.referrer_id = old.id)
     or exists (select 1 from public.clients c where c.referrer_id = old.id) then
    raise exception 'Referrer % has clients or deals and cannot be deleted', old.id
      using errcode = '23503',
            hint = 'Keep the referrer; their history and referral fees depend on it.';
  end if;
  return old;
end
$$;
comment on function public.referrers_guard_delete() is 'Blocks deleting a referrer who still has clients or deals.';
revoke all on function public.referrers_guard_delete() from public, anon, authenticated;

create trigger referrers_guard_delete
before delete on public.referrers
for each row execute function public.referrers_guard_delete();
