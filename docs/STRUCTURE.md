# STRUCTURE.md — Where code goes

Agreed at kick-off (2026-11-23). Keep to this layout; add a line to DECISIONS.md before changing it.

```
src/
├── app/
│   ├── (auth)/              login, reset-password, auth/callback — no app shell
│   ├── (app)/               authenticated shell (sidebar + top bar); every screen in SCREENS.md
│   │   ├── dashboard/  clients/  deals/  repayments/  follow-ups/  outbox/
│   │   ├── referrers/  financiers/  settings/
│   │   └── finance/         accountant area: receivables, payables, journals, transactions,
│   │                        accounts, ledger, reports/[report], periods
│   ├── styleguide/          tokens + components showcase (task 0.2)
│   └── api/export/          route handlers that stream Excel / PDF
├── components/
│   ├── ui/                  shadcn primitives, restyled to DESIGN.md tokens
│   ├── shell/               sidebar, top bar, command palette, bell, user menu
│   ├── data-table/          TanStack Table wrapper, toolbar, pagination, export
│   ├── charts/              Recharts wrappers using the DESIGN.md chart palette
│   └── common/              kpi-card, status-badge, money-text, date-text, page-header, empty-state
├── features/<module>/       clients, deals, repayments, finance, …
│   ├── actions.ts           Server Actions: zod-validate, re-check role, call DB functions
│   ├── queries.ts           server-side reads
│   ├── schemas.ts           zod schemas shared by forms and actions
│   └── components/          module-specific UI
├── hooks/                   client hooks
├── lib/
│   ├── supabase/            server, browser, proxy and admin clients (@supabase/ssr)
│   ├── auth/                get-session, require-role
│   ├── money/               decimal.js helpers — never float maths on money
│   ├── format/              ₦ / date (Africa/Lagos) / BVN-NIN masking
│   ├── export/              exceljs + @react-pdf letterhead
│   └── utils.ts             cn()
├── types/database.ts        generated Supabase types (do not edit)
└── proxy.ts                 route protection by role (Next.js 16: replaces middleware.ts)

supabase/
├── migrations/              all schema, RLS, functions, pg_cron — the only way to change the DB
├── seed/                    repeatable seed; calls the same SQL functions as the app
└── tests/                   pgTAP: RLS proofs (accountant denied), money functions

tests/                       Vitest unit tests (schedules, fees, statements, formatting)
```

Rules of thumb
- Money logic (schedules, fee recognition, journals, reminders) lives in Postgres functions; TypeScript calls them.
- Server Components by default; a file gets `"use client"` only when it needs interaction.
- File names kebab-case; components PascalCase; one component per file.
