# DECISIONS.md — Decision log

Add one line per decision: date · decision · reason. Never reopen a decision without updating this file.

- 2026-11-23 · Demo uses our own Nigerian-standard KYC/CIS forms, chart of accounts and fictional data · P&T will share real documents only after contract; forms and accounts are configurable so they can be swapped in later.
- 2026-11-23 · Only CEO and Accountant log in; other staff get email notifications only · Requested by P&T CEO.
- 2026-11-23 · Interest rates stored and shown per month · P&T's financiers quote 4.7%–8% per month.
- 2026-11-23 · Provider commission recognised on first confirmed repayment; client and collateral fees on disbursement · As stated by P&T CEO.
- 2026-11-23 · Client-facing WhatsApp/SMS reminders and credit bureau API are Phase 2 · Per-message/per-check costs and setup.
- 2026-11-23 · Demo emails go to an in-app Outbox instead of being sent · Avoid emailing real people during the demo.
- 2026-11-23 · Stack: Next.js + Supabase + Vercel · Same stack as Lamadra SMS; low running cost.
- 2026-11-23 · Palette taken from P&T's logo: navy #011A32 primary; cyan #00F6F1 and mint #00EAA2 only on navy surfaces; ink teal #00796F for teal text on white · Neon cyan/mint fail contrast on white.

### Kick-off clarifications (2026-11-23, approved by owner)
- 2026-11-23 · Accountant may update `deal_fees` status (received/paid) only through receipt/payment server functions, and may read referrer name, bank_name and account_name · Needed to record receipts and pay referrers.
- 2026-11-23 · Accountant reads client display name, deal reference and financier name only via security-invoker views / narrow security-definer functions, never the raw tables · RLS is row-level; column restriction needs views.
- 2026-11-23 · Add `audit_log` table (actor, action, entity, entity_id, before, after, at); "viewed" = CEO opening a KYC profile with unmasked BVN/NIN or generating a signed URL for a KYC/credit document · NDPA requirement in SECURITY.md.
- 2026-11-23 · Demo users are created by the seed script via the Supabase admin API (no invite emails); Supabase's own auth emails (invite, reset) are allowed to send for real; more than one CEO is allowed · Outbox can't intercept Supabase Auth mail.
- 2026-11-23 · Demo credentials shown on the login page only when `NEXT_PUBLIC_DEMO_MODE=true`; demo data is fictional so no extra URL protection required · Keeps the demo simple.
- 2026-11-23 · Session idle timeout 60 minutes, absolute 12 hours; "sign out everywhere" lets the CEO revoke all sessions of any user, including their own · Not specified in SECURITY.md.
- 2026-11-23 · `deals.stage_id` is the source of truth for progress; `outcome` only records open / negotiating / declined_by_lender / declined_by_client / defaulted / completed. Declined deals keep the stage they were declined at. `defaulted` is set manually by the CEO; the system flags candidates (2+ overdue instalments) · Stage and outcome overlapped.
- 2026-11-23 · Stage exit criteria are warnings, not blocks; the CEO can override with a note saved in stage history. Moving to Disbursed always goes through the Disburse action · Real deals don't follow the checklist perfectly.
- 2026-11-23 · Flat interest = amount disbursed × monthly rate × months. Monthly: equal principal + equal interest per month. Quarterly: equal principal per quarter + 3 × monthly rate interest. Bullet: all principal and interest at maturity. Rounding difference goes on the last instalment · Schedule maths unspecified.
- 2026-11-23 · One reported payment is allocated oldest-instalment-first and may cover several instalments; overpayment beyond the deal's outstanding balance is rejected. A partially paid instalment past its due date is Overdue (balance shown) · Partial-payment rules unspecified.
- 2026-11-23 · Reliability "on time" uses the client's `paid_on` date (≤ 3 days after due), not confirmation date. Badges (configurable in Settings): Good = ≥ 90% on time and nothing overdue; Watch = 70–89% or overdue ≤ 30 days; High risk = < 70%, any overdue > 30 days, or defaulted · Confirmation lag shouldn't penalise clients.
- 2026-11-23 · Client fee and collateral fee default to a base of amount disbursed (editable per fee line via `base_amount`) · Base unspecified.
- 2026-11-23 · Fees are VAT-exclusive; VAT (default 7.5%) posts to 2200 VAT payable at recognition. Receipts may record WHT deducted (default 10%) to new account 1120 WHT receivable (tax credit). Rates are settings · Nigerian practice; chart lacked a WHT asset.
- 2026-11-23 · Drop the `invoiced` fee status; invoicing is out of scope for the demo · No invoice workflow exists.
- 2026-11-23 · No year-end close step: retained earnings in reports = opening retained earnings + all prior-year profit, computed on the fly · Simpler and always correct.
- 2026-11-23 · Seed dates are relative to the day the seed runs; opening balances fixed at 1 Jan of the current year. Tests assert balancing, not fixed totals · Keeps "due this week"/"overdue" realistic.
- 2026-11-23 · Saved table filters stored per user in a `saved_views` table · DESIGN.md requires saved filters.
- 2026-11-23 · `external_exposures` is the itemised source of truth; `credit_checks.total_exposure` is the bureau-reported snapshot at check date · The two overlapped.
- 2026-11-23 · Use a hosted Supabase project (no local Docker stack); migrations applied with the Supabase CLI (`supabase db push`) · Windows machine; simpler setup.
- 2026-11-23 · Extra libraries: decimal.js (money maths in TS), Vitest (unit tests), pgTAP (RLS/DB tests), dnd-kit (Kanban drag-and-drop) · Stack didn't cover these.
- 2026-11-23 · Money logic (schedule generation, fee recognition, journal posting, reminders) lives in Postgres functions called by Server Actions, the seed and pg_cron; numeric values cross the API as text · One source of truth; avoids JS float precision.
- 2026-11-23 · Add `reminder_log` (schedule_id/deal_id, condition, sent_on, unique) for duplicate suppression; pg_cron schedule `0 6 * * *` UTC = 07:00 Africa/Lagos · "No duplicates" rule needs a key.
- 2026-11-23 · PDFs embed the Inter font so the ₦ glyph renders · @react-pdf built-in fonts lack ₦.
