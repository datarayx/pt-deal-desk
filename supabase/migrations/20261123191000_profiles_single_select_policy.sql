-- Database advisor 0006 (multiple permissive policies): merge the two SELECT policies on
-- profiles into one, so Postgres evaluates a single policy per row. Same rule as before:
-- you can read your own profile; the CEO can read all.

drop policy "profiles: read own" on public.profiles;
drop policy "profiles: ceo reads all" on public.profiles;

create policy "profiles: read own, ceo reads all"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.auth_role()) = 'ceo');
