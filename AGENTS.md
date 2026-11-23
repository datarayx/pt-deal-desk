# AGENTS.md — Rules for the AI coding assistant

> Copy this file as `CLAUDE.md` (Claude Code), `.cursorrules` (Cursor) or `.windsurfrules` (Windsurf). Same content.

## Project
**P&T Deal Desk** — a web app for P&T, a Nigerian financial facilitation firm that connects businesses needing funding with finance houses and banks. P&T does not lend or hold the money: it tracks clients, KYC, deals, repayments reported by clients, its own fees, and its own books.

This is first a **demo with sample data**, later the production app. Build everything production-grade anyway.

## Always read before working
- `docs/PRD.md` — what to build
- `docs/DESIGN.md` — how it must look (non-negotiable)
- `docs/DATA_MODEL.md`, `docs/WORKFLOWS.md`, `docs/ACCOUNTING.md`, `docs/SECURITY.md` — when touching those areas
- `TASKS.md` — what's done and what's next
- `DECISIONS.md` — decisions already made; do not reopen them

## Tech stack (do not substitute)
- **Next.js (App Router) + TypeScript (strict)**
- **Tailwind CSS + shadcn/ui** (Radix primitives), **lucide-react** icons
- **Supabase**: Postgres, Auth, Storage (private buckets), Row-Level Security, pg_cron
- **@supabase/ssr** for server/client auth
- **TanStack Table** for data tables · **react-hook-form + zod** for forms · **Recharts** (via shadcn charts) for charts
- **date-fns** for dates · **exceljs** for Excel export · **@react-pdf/renderer** for PDF export
- **Resend** for email (demo: write to an in-app "Outbox" instead of sending)
- Hosted on **Vercel**

## Conventions
- Money: store as `numeric(18,2)` in Postgres, handle as strings/decimal in code, never JS float maths for totals. Display as `₦1,250,000.00` using `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })`.
- Dates: display `23 Nov 2026`; timezone `Africa/Lagos`.
- Interest rates are **per month** (e.g. 4.7%–8%), label them "per month" everywhere.
- Server Components by default; Client Components only where interaction needs it.
- Data writes via Server Actions with zod validation; never trust the client.
- All DB changes via SQL migration files in `supabase/migrations/`. Never edit the DB by hand.
- Every list page: search, filters, sorting, pagination, empty state, loading skeleton, error state.
- File names kebab-case; components PascalCase; one component per file.
- No `any`. No console.logs left behind. No hard-coded secrets — use `.env.local` and list keys in `.env.example`.

## Working style
- Work on **one task from TASKS.md at a time**. Before coding, state your plan in 3–6 bullets.
- After finishing: run `npm run lint` and `npm run build`, fix errors, tick the task in TASKS.md, and summarise what changed.
- If something in the docs is unclear or contradictory, ask — don't guess.
- If you make a design or technical decision not covered by the docs, add one line to DECISIONS.md.
- Never delete or rewrite working features you weren't asked to touch.

## UI quality bar
Read `docs/DESIGN.md`. The app must look like a polished fintech product (Linear / Stripe Dashboard / Mercury quality), not a template. Consistent spacing, real hierarchy, tabular numbers, thoughtful empty states, and no generic "AI-looking" gradients or emoji.
