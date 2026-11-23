-- Follow-up to 20261123180000_profiles_and_roles.
-- Supabase grants ALL on new public tables to anon/authenticated by default. The previous
-- migration removed insert/update/delete but left TRUNCATE, REFERENCES and TRIGGER.
-- TRUNCATE ignores Row-Level Security, so any signed-in user could have emptied profiles.

revoke truncate, references, trigger on public.profiles from anon, authenticated;

-- Stop future tables (created by migrations, which run as postgres) from getting these
-- privileges at all. Each table still grants exactly what it needs in its own migration.
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;
