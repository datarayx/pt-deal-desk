# TASKS.md — Build checklist (AI ticks these off)

## Phase 0 — Foundation
- [x] 0.1 Scaffold Next.js + TS + Tailwind + shadcn/ui; ESLint/Prettier; folder structure
- [x] 0.2 Design tokens (light/dark) + fonts per DESIGN.md; component restyle
- [x] 0.3 App shell: sidebar, top bar, ⌘K, bell, user menu, theme toggle
- [x] 0.4 Supabase project, env vars, @supabase/ssr auth, login/reset pages
- [x] 0.5 Roles + RLS helper + route protection per role

## Phase 1 — Data
- [x] 1.1 Migrations: all tables, enums, constraints, indexes, RLS policies
- [x] 1.2 Storage buckets + policies
- [x] 1.3 Seed script per SEED_DATA.md
- [x] 1.4 Generated TypeScript types

## Phase 2 — Core modules
- [x] 2.1 Settings (stages, facility types, KYC checklists, recipients, reminder days, fee defaults)
- [x] 2.2 Financiers + requirement templates
- [x] 2.3 Referrers
- [x] 2.4 Clients list + multi-step create (individual/company + directors)
- [x] 2.5 Client 360 (KYC docs, credit checks, exposures, deals, activity)
- [x] 2.6 Deals: Kanban + table + create sheet
- [x] 2.7 Deal detail: requirements/deficiencies, stage moves, decline/negotiate, disburse
- [x] 2.8 Repayment schedule generation + repayments page + proof upload + confirm
- [x] 2.9 Follow-up tasks + call log

## Phase 3 — Money
- [x] 3.1 Chart of accounts + journals engine (balanced, period lock)
- [x] 3.2 Fee rules + automatic recognition triggers
- [x] 3.3 Receivables, payables, receipts, payments, expenses
- [x] 3.4 Reports: trial balance, P&L, financial position, cash flows
- [x] 3.5 Excel + PDF export for all reports and tables

## Phase 4 — Intelligence & alerts
- [x] 4.1 Daily pg_cron job: due/overdue/stale → alerts + outbox + follow-up tasks
- [x] 4.2 Bell dropdown + Outbox page
- [x] 4.3 Reliability scoring view + badges
- [x] 4.4 CEO dashboard + Finance dashboard with charts

## Phase 5 — Polish & ship
- [ ] 5.1 UI polish pass (every screen vs DESIGN.md)
- [ ] 5.2 Empty/loading/error states everywhere; responsive check
- [ ] 5.3 Security review (RLS tests as accountant)
- [ ] 5.4 Tests for money logic (schedules, fees, trial balance)
- [ ] 5.5 Deploy to Vercel; demo accounts; demo walkthrough script
