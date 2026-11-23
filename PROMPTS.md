# PROMPTS.md — Paste these in order

How to use: paste one prompt, let the AI finish, **test it in the browser**, then `git commit`. Only then move to the next prompt. If something breaks, use the Fix prompts at the bottom.

---

## STAGE A — Kick-off

### Prompt 0 — Read & plan (no code yet)
```
Read README.md, AGENTS.md, TASKS.md, DECISIONS.md and every file in docs/. Do not write any code yet.
Then give me:
1. A one-paragraph summary of the app in your own words.
2. Anything unclear, contradictory or missing in the docs (list questions).
3. Your proposed folder structure for the Next.js app.
4. Any risks you see in the plan.
Wait for my answers before building.
```

### Prompt 1 — Scaffold (Task 0.1)
```
Do task 0.1 from TASKS.md. Create the Next.js (App Router, TypeScript strict) project in this folder with Tailwind and shadcn/ui, ESLint and Prettier. Use the folder structure we agreed. Add .env.example. Run lint and build, then tick 0.1 in TASKS.md.
```

### Prompt 2 — Design system (Task 0.2) — the most important UI step
```
Do task 0.2. Implement docs/DESIGN.md exactly:
- CSS variables for all colour tokens in light and dark mode, wired into Tailwind and shadcn theme.
- Inter font with tabular numbers utility.
- Restyle these shadcn components to the tokens: Button, Input, Select, Badge, Card, Table, Tabs, Dialog, Sheet, DropdownMenu, Tooltip, Toast.
- Build reusable components: KpiCard, StatusBadge (with dot + label), PageHeader, EmptyState, MoneyText (₦ formatting, en-NG, negatives in danger), DateText.
- Create a /styleguide page that shows every token and component in light and dark mode.
Make it look like Stripe Dashboard / Linear quality — not default shadcn grey.
```
→ Open `/styleguide`, take screenshots, and refine (see "UI review" prompt below) **before** moving on. Every later screen inherits this.

### Prompt 3 — App shell (Task 0.3)
```
Do task 0.3. Build the authenticated app shell per DESIGN.md §4 and SCREENS.md "Global": collapsible left sidebar with sections (Overview, Clients, Deals, Repayments, Follow-ups, Partners, Finance, Settings), top bar with ⌘K command palette, notification bell (static for now), user menu with theme toggle. Sidebar becomes a drawer on mobile. Use placeholder pages for every route in SCREENS.md.
```

### Prompt 4 — Auth & roles (Tasks 0.4, 0.5)
```
Do tasks 0.4 and 0.5. Connect Supabase using @supabase/ssr (I've put the keys in .env.local). Build login and reset-password pages per SCREENS.md (split layout). Create the profiles table with role ceo|accountant. Protect routes: accountant can only reach /finance/*; ceo reaches everything. Hide sidebar items the user can't access. Explain how to create the two demo users.
```

---

## STAGE B — Database

### Prompt 5 — Schema & security (Tasks 1.1, 1.2)
```
Do tasks 1.1 and 1.2. Write Supabase SQL migrations for every table, enum, constraint and index in docs/DATA_MODEL.md, with RLS enabled and policies exactly as in docs/SECURITY.md. Add the balanced-journal constraint/trigger and the period-lock check. Create the private storage buckets with role-based policies. Then list every table with its policies so I can review.
```

### Prompt 6 — Seed data (Tasks 1.3, 1.4)
```
Do tasks 1.3 and 1.4. Write a repeatable seed script that creates the demo data described in docs/SEED_DATA.md — realistic Nigerian names, places, naira amounts, dates over the last 10 months. Make sure every scenario listed (declined, negotiating, stale, defaulter, completed) exists. Generate fees and journals through the same functions the app will use, so the books balance. Generate TypeScript types from the schema.
```

---

## STAGE C — Features (one prompt per task)

### Prompt 7 — Settings
```
Do task 2.1: the Settings area per SCREENS.md. Editable lists for deal stages (drag to reorder), facility types, KYC document checklists per client type, notification recipients, reminder timings, fee defaults, company profile & logo. Use side sheets for editing.
```

### Prompt 8 — Financiers & referrers
```
Do tasks 2.2 and 2.3: Financiers (list, detail, requirement checklist template) and Referrers (list, detail with stats: clients referred, deals funded, fees earned/paid). Follow the data table pattern in DESIGN.md §5.
```

### Prompt 9 — Clients
```
Do task 2.4: Clients list and the multi-step New Client flow (type → details → directors for companies → documents → review) per SCREENS.md. Nigerian validation: +234 phone, 11-digit BVN and NIN, RC number. Mask BVN/NIN in lists. Directors are individual profiles linked with role and shareholding %.
```

### Prompt 10 — Client 360
```
Do task 2.5: Client 360 page with header (name, type, KYC badge, reliability badge) and tabs: Overview, KYC & Documents (upload, verify, expiry), Directors, Credit checks (add check with report upload, exposures), Deals, Repayments, Activity timeline.
```

### Prompt 11 — Deals pipeline
```
Do task 2.6: Deals page with Kanban and Table views. Kanban columns = stages with count and total ₦; cards show client, financier, amount, days in stage, deficiency count, stale indicator. Drag a card to move stage (records stage history). New Deal side sheet per SCREENS.md, which copies the financier's requirement list into the deal.
```

### Prompt 12 — Deal detail
```
Do task 2.7: Deal detail page per SCREENS.md and WORKFLOWS.md §2. Requirements tab shows deficiencies. Actions: Move stage, Decline (lender/client + reason), Mark negotiating, Disburse (amount, date, first repayment date, frequency) which generates the repayment schedule.
```

### Prompt 13 — Repayments & follow-ups
```
Do tasks 2.8 and 2.9 per WORKFLOWS.md §3: repayments page with tabs (Due soon, Overdue, Reported, Confirmed); "Record reported payment" with proof upload; "Confirm with financier"; partial payments. Follow-ups page with call tasks and a call-log form (outcome, promise-to-pay date).
```

### Prompt 14 — Accounting engine
```
Do tasks 3.1 and 3.2 per docs/ACCOUNTING.md and WORKFLOWS.md §4: chart of accounts screen, journals (manual journal form that refuses unbalanced entries), period lock, and automatic fee recognition at the triggers (provider commission on first confirmed repayment; client and collateral fees on disbursement; referral fee payable on disbursement). Write unit tests for the fee and journal logic.
```

### Prompt 15 — Receivables, payables, transactions
```
Do task 3.3: fee receivables, payables, record receipt, record payment, quick expense entry — each posts the correct journal. Accountant sees deal reference and client name only, nothing else from the client record.
```

### Prompt 16 — Financial reports & exports
```
Do tasks 3.4 and 3.5: Trial balance, Statement of profit or loss, Statement of financial position and Statement of cash flows (indirect) per ACCOUNTING.md, with period picker (month/quarter/year/custom) and prior-period comparison. Add Excel (exceljs) and PDF (@react-pdf/renderer, with company header) export to every report and to every data table. Add tests proving the trial balance and balance sheet balance on the seed data.
```

### Prompt 17 — Reminders & alerts
```
Do tasks 4.1 and 4.2 per WORKFLOWS.md §5: a Postgres function scheduled with pg_cron daily at 07:00 Africa/Lagos that creates alerts, outbox emails (demo mode: don't send) and follow-up tasks, with no duplicates. Build the bell dropdown (unread count, mark all read, click to open) and the Outbox page with an email preview. Add a "Run reminders now" button in Settings for the demo.
```

### Prompt 18 — Dashboards
```
Do tasks 4.3 and 4.4: reliability view and badges; CEO dashboard and Finance dashboard exactly as listed in SCREENS.md, with the charts in DESIGN.md §6. KPI cards with deltas vs last month. Every widget has loading skeleton and empty state.
```

---

## STAGE D — Polish, test, ship

### Prompt 19 — UI polish pass
```
Do task 5.1. Go screen by screen through SCREENS.md and compare against DESIGN.md. Fix: spacing inconsistencies, alignment of numbers (right-aligned, tabular), hierarchy, button sizes, one primary action per view, empty/loading/error states, dark mode, and mobile layout (tables become cards). List what you changed per screen.
```

### Prompt 20 — Security & tests
```
Do tasks 5.3 and 5.4. Log in as the accountant (via Supabase client in a test) and prove they cannot read clients, KYC, credit checks, deals or repayments — at DB level, not just UI. Add tests for repayment schedule generation, fee triggers, and balanced statements. Report results.
```

### Prompt 21 — Deploy & demo script
```
Do task 5.5. Prepare for Vercel deployment (env vars list, build check). Then write DEMO_SCRIPT.md: a 10-minute walkthrough that follows the "Demo acceptance" list in docs/PRD.md, with the exact clicks and which seed records to use.
```

---

## Reusable prompts (use any time)

**Start of every new session**
```
Read AGENTS.md, TASKS.md and DECISIONS.md. Tell me which task is next and your plan in 3–6 bullets before coding.
```

**UI review with a screenshot** (attach a screenshot)
```
Here's a screenshot of [screen]. Critique it against docs/DESIGN.md like a senior product designer at Stripe: hierarchy, spacing, typography, colour use, alignment, density, states. List the top 10 issues, most important first, then fix them.
```

**Bug fix**
```
Bug: [what I did] → [what happened] → [what I expected]. Error message: [paste].
Find the root cause before changing anything. Explain it in 2–3 sentences, then fix it with the smallest change. Don't touch unrelated code.
```

**Change request**
```
Change: [describe]. First update the relevant doc in docs/ and add a line to DECISIONS.md, then update the code. Tell me every file you changed.
```

**When the AI goes in circles**
```
Stop. Revert to the last commit. Summarise what we tried and why it failed, then propose two different approaches and wait for me to choose.
```

**Swapping in P&T's real documents later**
```
P&T has provided their real [KYC form / chart of accounts / P&L format] (attached). Update Settings data (checklists, accounts, report layout) to match. Prefer configuration over code changes. List anything that needed code.
```
