-- Task 1.2 — private storage buckets (docs/SECURITY.md "Files").
-- All four buckets hold client information (KYC, credit reports, deal paperwork, payment proofs),
-- which the accountant may not see, so the same rule as the tables applies: CEO only.
-- Buckets are private: files are reached only through short-lived signed URLs created
-- server-side after the role check (and logged to audit_log for KYC / credit documents).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('kyc', 'kyc', false, 10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('credit-reports', 'credit-reports', false, 10485760,
    array['application/pdf', 'image/jpeg', 'image/png']),
  ('deal-docs', 'deal-docs', false, 20971520,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('repayment-proofs', 'repayment-proofs', false, 10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- One policy covers every operation on these four buckets. No anon policy: signed-out users get
-- nothing. Other buckets (none yet) are unaffected.
create policy "pt private buckets: ceo all"
  on storage.objects for all to authenticated
  using (
    bucket_id in ('kyc', 'credit-reports', 'deal-docs', 'repayment-proofs')
    and (select public.auth_role()) = 'ceo'
  )
  with check (
    bucket_id in ('kyc', 'credit-reports', 'deal-docs', 'repayment-proofs')
    and (select public.auth_role()) = 'ceo'
  );
