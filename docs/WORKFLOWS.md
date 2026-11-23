# WORKFLOWS.md — Business processes

## 1. Client onboarding
1. Enquiry arrives (email, WhatsApp, phone, secretary, website, referral). Record source + referrer.
2. Create client (individual or company). For companies, add every director/shareholder as an individual profile.
3. KYC/CIS captured; documents uploaded against the checklist. KYC status: Incomplete → Submitted → Verified (CEO verifies).
4. Credit bureau check recorded (report uploaded) + exposures to other lenders.

## 2. Deal pipeline (default stages — configurable)
| # | Stage | Exit criteria |
|---|---|---|
| 1 | Enquiry | Client created |
| 2 | KYC & CIS | KYC submitted |
| 3 | Transaction review | Executive summary + client P&L reviewed; urgency, cycle, margin noted |
| 4 | Structuring | Facility type, tenor, rate band, financier chosen |
| 5 | Requirements | Financier's requirement list issued; deficiencies tracked |
| 6 | Submitted | All required items received; submitted to financier |
| 7 | Risk analysis | — |
| 8 | Approved | Offer received: amount approved, rate, fees |
| 9 | Collateral & documentation | Collateral valued / guarantor + cheques; offer signed |
| 10 | Disbursed | Disbursement date + amount → **repayment schedule generated** |
| 11 | Repaying | — |
| 12 | Completed | All instalments confirmed |

Side outcomes (any stage): **Declined by lender**, **Declined by client** (e.g. after fees disclosed: insurance, management, legal, project manager), **Negotiating** (can return to a stage). Reason is mandatory. A declined deal keeps the stage it was declined at. **Defaulted** is set manually by the CEO; the system flags deals with 2+ overdue instalments.

Exit criteria are **warnings, not blocks**: the CEO may override with a note (saved in stage history). Moving to Disbursed always goes through the Disburse action.

Stale rule: a deal in the same non-terminal stage for **> 30 days** → alert to CEO + email to notification recipients, repeating weekly.

## 3. Repayments
1. On disbursement, generate instalments from tenor, frequency, amount and monthly rate (flat interest by default; editable per line). Total interest = amount disbursed × monthly rate × tenor months.
   - **Monthly**: equal principal + equal interest each month.
   - **Quarterly**: equal principal per quarter + interest at 3 × monthly rate.
   - **Bullet**: all principal and interest in one instalment at maturity.
   - Rounding difference goes on the last instalment.
2. Client sends proof (receipt / bank alert / WhatsApp) → user records a **reported repayment** with proof → status *Reported*. One payment is allocated oldest-instalment-first and may cover several instalments; payments above the deal's outstanding balance are rejected.
3. P&T confirms with financier (email/WhatsApp) → mark **Confirmed** (date, note).
4. Partial payments allowed (status *Partially paid*, balance carried). A partially paid instalment past its due date becomes *Overdue* with the balance shown.

## 4. Fee recognition (automatic)
| Fee | Basis | Trigger | Journal |
|---|---|---|---|
| Provider commission | % of amount disbursed or flat | **First repayment confirmed** | Dr Fees Receivable – Commission / Cr Commission Income |
| Client fee | % of amount disbursed (editable base) or flat | **Disbursement** | Dr Fees Receivable – Client Fees / Cr Advisory Fee Income |
| Collateral negotiation fee | % of amount disbursed (editable base) or flat | **Disbursement** | Dr Fees Receivable – Client Fees / Cr Collateral Fee Income |
| Referral fee (payable) | % or flat, agreed per deal | **Disbursement** (configurable) | Dr Referral Fee Expense / Cr Referral Fees Payable |

Receiving a fee: Dr Bank / Cr Fees Receivable (WHT deducted → Dr WHT receivable). Paying a referrer: Dr Referral Fees Payable / Cr Bank. Fees are VAT-exclusive; VAT and WHT rates in Settings (see ACCOUNTING.md). Each trigger is idempotent: re-confirming a repayment never recognises a fee twice; corrections are reversals.

## 5. Reminders & escalation (daily job, 07:00 Africa/Lagos, pg_cron)
| Condition | In-app alert (CEO) | Email to recipients | Extra |
|---|---|---|---|
| Due in 7 days | ✓ | ✓ | — |
| Due in 3 days | ✓ | ✓ | — |
| Due today | ✓ | ✓ | — |
| Overdue (not confirmed) | ✓ daily | ✓ **twice weekly (Mon & Thu)** | Mark instalment Overdue; create **follow-up call task** if none open |
| Deal stale > 30 days | ✓ | ✓ weekly | — |

Rules: never send duplicates for the same instalment + condition + day (enforced by the unique key on `reminder_log`); stop all reminders once confirmed. In the demo, emails go to the **Outbox** table instead of being sent. pg_cron runs in UTC: schedule `0 6 * * *` = 07:00 Africa/Lagos.

## 6. Reliability
Per client: on-time % (client's `paid_on` within 3 days of due — not the confirmation date), average days late, current overdue amount, number of defaults, plus latest bureau rating & external exposure (sum of `external_exposures`). Badge (thresholds in Settings): **Good** = ≥ 90% on time and nothing overdue; **Watch** = 70–89% or overdue ≤ 30 days; **High risk** = < 70%, any overdue > 30 days, or defaulted.
