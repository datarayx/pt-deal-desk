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

### Task 0.1 — scaffold
- 2026-11-23 · Next.js 16.4.6 + React 19.3 + Tailwind 4.3 (Turbopack), `src/` dir, `@/*` alias; keep the scaffold defaults `cacheComponents` and `partialPrefetching` on · Current stable; defaults are the supported path in v16.
- 2026-11-23 · Route protection lives in `src/proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts`) · Per bundled Next.js 16 docs.
- 2026-11-23 · shadcn/ui 4.23 initialised with the Radix base ("radix-nova" style), neutral base colour, lucide icons; restyle to DESIGN.md tokens happens in task 0.2 · AGENTS.md mandates Radix primitives.
- 2026-11-23 · Keep shadcn's `cn` package (official shadcn-ui replacement for clsx + tailwind-merge); `shadcn` CLI is a devDependency · It is only needed at build time for `shadcn/tailwind.css` and for adding components.
- 2026-11-23 · Folder layout recorded in docs/STRUCTURE.md · The kick-off agreement only existed in chat.
- 2026-11-23 · Prettier (print width 100, double quotes, trailing commas, LF) with the Tailwind class-sorting plugin; eslint-config-prettier disables clashing rules; `.md` docs excluded from formatting; `.gitattributes` forces LF · Consistent diffs on Windows.
- 2026-11-23 · ESLint enforces AGENTS.md rules: `no-explicit-any` and `no-console` (warn/error allowed) as errors · Make the conventions automatic.
- 2026-11-23 · Supabase env vars use the new key names `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` · Supabase's current API keys replace anon / service_role.
- 2026-11-23 · Inter loaded with next/font as `--font-sans` now (type scale and tabular-nums in task 0.2) · shadcn init left the font pointing at the removed Geist.
- 2026-11-23 · Next.js 16 re-adds a "nextjs-agent-rules" block to AGENTS.md on `next dev`; it is committed as part of AGENTS.md · Avoids a permanent unexplained diff.

### Task 0.2 — design system
- 2026-11-23 · Token names follow DESIGN.md, except DESIGN `--muted` → `--muted-foreground` and DESIGN `--accent` → `--accent-ink`; shadcn's `muted`/`accent` keep their meaning (subtle backgrounds) and are mapped onto our tokens · Components added later with `shadcn add` inherit the brand without breaking.
- 2026-11-23 · Derived tokens not in DESIGN.md: `--surface-subtle`, `--border-strong`, dark-mode soft badge colours, `--danger-foreground`, `--kpi-hero-negative`, `--overlay`; dark chart series 1 = `#C9D6E3` (navy is invisible on the dark background) · DESIGN.md gives light-mode values only for these.
- 2026-11-23 · Theme via next-themes (class on `<html>`, default "system"). Colours come only from tokens — no `dark:` utilities — so a `.light`/`.dark` wrapper can theme any subtree · Lets /styleguide show both modes side by side.
- 2026-11-23 · `cn` is created in `src/lib/utils.ts` with `createCn` so tailwind-merge knows the custom type scale; ESLint forbids importing `cn` from "cn" · Otherwise `text-caption` etc. were treated as colours and removed text colours (found visually on /styleguide).
- 2026-11-23 · Toasts use shadcn's `sonner` (shadcn's toast component is deprecated in favour of it) · Prompt asked for "Toast".
- 2026-11-23 · Tabs: "line" (default, detail pages) and "segmented" (view toggles) variants; Button gets a `pending` prop; Label gets `required`; Sheet gets `SheetBody` (scrolling) and floats with 16px radius · DESIGN.md §5 and §7 requirements.
- 2026-11-23 · Focus: global 2px `--focus-ring` outline on `:focus-visible`; text fields use border + soft ring instead · DESIGN.md §7; outline on inputs looked detached.
- 2026-11-23 · MoneyText formats the Postgres decimal string directly with Intl (exact, half-up rounding, `signDisplay: "negative"`); DateText treats `YYYY-MM-DD` as a calendar date (never shifted) and instants as Africa/Lagos · No float maths; due dates must not move a day.
- 2026-11-23 · Domain status → tone/label maps live in `src/lib/status.ts` · One place decides how every status looks.
- 2026-11-23 · Vitest 5 for unit tests (`npm test`); `@types/node` bumped to 24 to satisfy its peer range and match the Node 24 runtime · Vitest 5 requires @types/node ≥ 22.
- 2026-11-23 · "One component per file" means one *exported* component; small private helpers (e.g. a swatch) may live beside it · Keeps files cohesive without dozens of 10-line files.
- 2026-11-23 · Shared class strings for fields, popovers and menu rows live in `src/components/ui/styles.ts` · Inputs and selects line up exactly; plain module so Server Components can import it.

### Task 0.3 — app shell
- 2026-11-23 · Custom sidebar instead of shadcn's `sidebar` block · Adding the block would overwrite the restyled 0.2 components, and DESIGN.md's navy rail with a 3px cyan bar is simple to own.
- 2026-11-23 · Sidebar: top group Overview · Clients · Deals · Repayments · Follow-ups, then "Partners" (Referrers, Financiers) and "Finance" (9 pages), with Outbox and Settings pinned at the bottom · Matches the prompt's sections; Outbox (SCREENS.md) had no section of its own.
- 2026-11-23 · `src/lib/navigation.ts` is the single nav config (sidebar, drawer, ⌘K, breadcrumb) and carries each page's roles for task 0.5 · One place to add a page.
- 2026-11-23 · Collapsed state lives in localStorage + a `data-sidebar-collapsed` attribute on `<html>`, restored before paint by a `beforeInteractive` inline script in the root layout; Tailwind variants `sidebar-collapsed:` / `sidebar-expanded:` read it · No flash, and no cookies (reading cookies would make every page dynamic under cacheComponents).
- 2026-11-23 · Nav and breadcrumb read `usePathname()` inside `<Suspense>`; the fallback is the same nav with nothing highlighted · Next 16 cacheComponents can't know the path of dynamic routes (`/clients/[id]`) while prerendering the static shell; the build fails otherwise.
- 2026-11-23 · Client shell components receive only `role`/`user` and read the nav config themselves · Icon components are functions and can't be passed from Server to Client Components.
- 2026-11-23 · ⌘K/Ctrl+K and "/" open the palette; Ctrl/⌘+B toggles the sidebar; matching is word-prefix (`src/lib/command-filter.ts`), not cmdk's fuzzy default · Fuzzy matching surfaced unrelated pages ("trial" → Financiers).
- 2026-11-23 · Command and Popover written by hand on cmdk / radix-ui with the 0.2 styles · `shadcn add command` would overwrite the restyled Dialog.
- 2026-11-23 · Bell shows three static sample alerts and the shell shows a fictional demo CEO (Ngozi Adeyemi) until sign-in · Real alerts arrive in 4.1/4.2, the real user in 0.4.
- 2026-11-23 · Placeholder pages for every SCREENS.md route name the TASKS.md task that builds them; `/` redirects to `/dashboard`, `/settings` to its first section · Nobody mistakes a placeholder for a bug.
- 2026-11-23 · npm audit: 4 moderate advisories are in the shadcn CLI (dev only, via ts-morph → minimatch); `npm audit --omit=dev` is clean · The suggested `--force` fix downgrades shadcn to 1.0.

### Tasks 0.4 / 0.5 — auth and roles
- 2026-11-23 · Roles come only from `auth.users.app_metadata.role` (settable only with the secret key); the `on_auth_user_created` trigger creates the profile. No role → profile created inactive → no access · user_metadata is user-editable; an accidental public sign-up must get nothing.
- 2026-11-23 · `public.auth_role()` (security definer, `search_path = ''`) returns the caller's role only if the profile is active; every RLS policy uses `(select public.auth_role())` · SECURITY.md helper; the subselect lets Postgres cache it per statement.
- 2026-11-23 · profiles RLS: read own row; CEO reads and updates all; updates limited by column grants to full_name, role, is_active; a trigger blocks changing your own role or deactivating yourself · Prevents a CEO lock-out and self-promotion.
- 2026-11-23 · Route protection in `src/proxy.ts`: refresh session (`getClaims()`), look up the active role in `profiles`, redirect signed-out → `/login?next=…`, no role → `/login?error=no-access`, accountant outside `/finance` → `/finance`. Rules live in `src/lib/auth/access.ts` and a test checks the nav config agrees with them · UI gate; RLS is the real guard.
- 2026-11-23 · Fail closed: with no Supabase keys the proxy returns 503 with setup instructions for every page except /styleguide · Never serve the app unprotected because of a config mistake.
- 2026-11-23 · Server Supabase client calls `cookies()` then `connection()` before touching Supabase · With `partialPrefetching`, cookies alone don't stop prerendering and the client reads `Date.now()` (Next 16 blocking-prerender-current-time, seen live after the first sign-in); also means the build never needs keys.
- 2026-11-23 · The shell's user parts (sidebar, top bar) load in `<Suspense>` with matching skeletons; pages stay partially prerendered · cacheComponents: session reads are request data.
- 2026-11-23 · Password reset: request page → Supabase email → `/auth/callback` (PKCE `code` or `token_hash`) → `/update-password`; same response whether or not the email exists; new passwords ≥ 10 characters · No account enumeration; Supabase's default minimum (6) is too short.
- 2026-11-23 · Demo users via `npm run demo:users` (`scripts/create-demo-users.mts`, Node 24 type stripping, reads `.env.local`); idempotent; fictional names Ngozi Adeyemi (CEO) and Tunde Bakare (Accountant). Demo credentials appear on /login only when `NEXT_PUBLIC_DEMO_MODE=true` · SEED_DATA.md.
- 2026-11-23 · Session idle (60 min) and absolute (12 h) limits from DECISIONS are Supabase Auth settings (Pro plan: "Time-box user sessions" / "Inactivity timeout"); not enforced in code yet · Needs the project's plan confirmed; revisit in task 5.3.
- 2026-11-23 · `/styleguide` stays public (no data) · Useful for design review without signing in.
- 2026-11-23 · Every table migration revokes TRUNCATE/REFERENCES/TRIGGER from anon and authenticated, and default privileges in `public` no longer grant them · Supabase grants ALL by default and TRUNCATE bypasses RLS (found on `profiles` after the first push; fixed by migration 20261123190000).
- 2026-11-23 · One permissive policy per table per action (combine conditions with `or`) · Database advisor 0006; fewer policies evaluated per row.
- 2026-11-23 · Migrations are applied with `npm run db:push` (Supabase CLI 3.3.0 as a devDependency, `db push --remote=<SUPABASE_DB_URL>` from `.env.local`), run through Node without a shell · The P&T project (`qfmnrluukunjkkghbnkp`) is not reachable from the Supabase connector's account; passing the URL through cmd.exe would break on special characters in the password.
