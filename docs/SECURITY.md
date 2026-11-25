# SECURITY.md — Access & data protection

## Roles enforced in the database (RLS), not just the UI
- Helper: `auth_role()` returns the caller's role from `profiles`.
- **ceo**: full read/write on all tables.
- **accountant**: read/write `accounts`, `journal_entries`, `journal_lines`, `periods`; read `deal_fees` and update fee status only through the receipt/payment functions; read referrer name, bank_name, account_name and the safe views (`v_fee_lines_finance`: deal reference, client display name, financier name). Safe views use `security_invoker` or narrow security-definer functions; **no access** to `clients` details, `individual_profiles`, `company_profiles`, `company_directors`, `client_documents`, `credit_checks`, `external_exposures`, `repayment_*`, `follow_up_tasks`, `financiers` contact details.
- Accountants may receive **sanitized reminder summaries** in the notification bell. These contain only the reminder category and a link to `/finance`; the client, deal, repayment, and proof details remain CEO-only.
- Unauthenticated: nothing.
- Every new table ships with RLS enabled and explicit policies in the same migration.

## Files
- Supabase Storage **private** buckets: `kyc`, `credit-reports`, `deal-docs`, `repayment-proofs`. Access via short-lived signed URLs only. Same role rules as tables.

## Personal data (Nigeria Data Protection Act 2023)
- Collect only what's needed; record consent timestamp on KYC.
- Mask BVN/NIN in lists (`*******1234`); full value only on the profile page for CEO.
- Audit log (`audit_log`) of who changed KYC records, and who viewed them (CEO opening a profile with unmasked BVN/NIN, or generating a signed URL for a KYC/credit document).
- No real client data in the demo — seed data only.

## App
- Secrets only in env vars; `.env.example` lists names, never values.
- Server Actions validate input with zod and re-check role server-side.
- Session idle timeout 60 min, absolute 12 h; CEO can "sign out everywhere" for any user, including themself.
- Demo credentials appear on the login page only when `NEXT_PUBLIC_DEMO_MODE=true`. Demo users are created by the seed via the admin API (no invite emails).

