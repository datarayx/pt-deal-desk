# PRD — P&T Deal Desk (Phase 1 / Demo)

## 1. Problem
P&T connects clients (mostly companies in mining, real estate, agro, LPO contracting) with finance houses and banks. Funds go directly from the financier to the client, and clients repay the financier directly, then notify P&T. Records are on paper and WhatsApp, so P&T loses track of who was funded, by whom, how much has been repaid, what is overdue, and what fees P&T is owed.

## 2. Goals
1. One secure place for clients, KYC/CIS and credit checks.
2. Track every deal from enquiry to full repayment, including declined deals.
3. Never miss a repayment date: reminders and escalation for defaulters.
4. Automatically recognise P&T's fees and referral fees and keep proper books.
5. Give the CEO a one-screen view of the business; give the Accountant full financial statements.

## 3. Users
| Role | Logs in? | Sees |
|---|---|---|
| **CEO** (admin) | Yes | Everything; manages settings and users |
| **Accountant** | Yes | Accounting only: journals, ledger, trial balance, financial statements, fee receivables/payables. **No** client KYC, deal or credit details |
| **Business Manager, Admin, Head of Operations** | **No** | Receive email notifications only (due/overdue repayments, stale deals) |

## 4. Modules & features

### M1. Users, roles & notification recipients
- Email + password login (Supabase Auth); CEO invites users and assigns role.
- Settings: list of notification recipients (name, title, email), toggles per alert type.

### M2. Clients & KYC
- Client types: **Individual** and **Company**.
- Individual KYC/CIS: see DATA_MODEL `clients` + `individual_profiles`.
- Company KYC: company details + **directors/shareholders** (each linked to an individual profile with shareholding %).
- **Document checklist** per client type (configurable in Settings): upload, mark received/verified, expiry date where relevant.
- **Credit checks**: bureau (CRC, FirstCentral, CreditRegistry), date, rating, exposures to other lenders, delinquencies, report upload. Multiple checks over time.
- Source of enquiry (email, WhatsApp, phone, walk-in, website) and **referrer**.
- Client 360 page: profile, KYC status, credit history, all deals, repayment reliability, activity timeline.

### M3. Referrers & referral fees
- Referrer directory (person or firm: consultants, advisory firms, past clients).
- Referral fee agreed **per deal** (% or flat). Becomes a payable when the deal disburses (configurable).
- Referrer stats: clients referred, deals funded, fees earned/paid.

### M4. Financiers directory
- Finance houses / banks: name, type, contacts, typical monthly rate range, facility types offered, collateral requirements, standard requirement list (checklist).

### M5. Deal pipeline
- Stages (configurable, default list in WORKFLOWS.md) shown as **Kanban** and **table**.
- Deal fields: obligor (client), financier, facility type (LPO financing, asset financing, working capital, project finance…), amount requested/approved, tenor (months), interest rate **per month**, purpose of funds, collateral or guarantor (with cheques), other fees disclosed (insurance, management, legal, project manager), loan date, first repayment date, maturity date, repayment frequency.
- Requirement checklist per deal (copied from the financier's list); shows **deficiencies** (missing items).
- **Declined deals** recorded with who declined (lender/client), reason, and option to reopen as "Negotiating".
- Stale alert: deal in the same stage > 30 days.
- Activity log & notes; attachments (executive summary, offer letter…).

### M6. Repayments & follow-up
- Repayment schedule generated on disbursement (editable).
- Client-reported repayments with **proof upload** (receipt, bank alert, WhatsApp screenshot) → status *Reported* → *Confirmed by financier*.
- Statuses per instalment: Scheduled, Due, Reported, Confirmed, Overdue, Partially paid.
- **Reminders**: 7, 3, 0 days before due (configurable) → in-app + email to notification recipients.
- **Escalation for overdue**: reminders twice weekly; auto-create a **follow-up call task**; call log (date, by whom, outcome, promise-to-pay date).
- Reliability view per client: on-time %, days late average, current overdue, plus latest credit check.

### M7. Accounting & fees
- Fee rules per deal: provider commission, client fee, collateral negotiation fee — each % or flat.
- **Automatic fee recognition** at triggers (WORKFLOWS.md §4) → creates receivable + journal entry.
- Manual journals, expenses, receipts, payments; investment income.
- Double-entry ledger, trial balance, P&L, balance sheet, cash flow (ACCOUNTING.md).
- Financial year: 1 Jan – 31 Dec. Period close (lock a month).

### M8. Dashboard, reports & exports
- CEO dashboard: KPIs, ongoing transactions (financier, amount, stage, deficiency), upcoming & overdue repayments, outstanding balances, fees earned vs received, pipeline value by stage, top referrers.
- Accountant dashboard: receivables/payables, cash position, month's P&L snapshot.
- Every report exportable to **Excel and PDF**, by month, quarter, year, or custom range.

## 5. Out of scope (Phase 2+)
Client-facing WhatsApp/SMS reminders, credit bureau API integration, lending module, portfolio management for banks, investment advisory module, HR/payroll, mobile app.

## 6. Demo acceptance (what we must be able to show)
1. Log in as CEO → dashboard with realistic data.
2. Add a company client with 2 directors, upload KYC, record a credit check.
3. Create a deal, move it through the pipeline, see deficiencies, disburse it.
4. Repayment schedule appears; record a reported repayment with proof; confirm it.
5. See due/overdue alerts in the bell, the Outbox emails, and a follow-up call task.
6. See fees auto-recognised and the referral fee payable.
7. Log in as Accountant → cannot see clients/deals; can run trial balance, P&L, balance sheet, cash flow and export Excel/PDF.
