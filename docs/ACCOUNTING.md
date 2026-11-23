# ACCOUNTING.md — Books & reports

Double-entry, accrual basis, IFRS-style statement names as commonly used in Nigeria. Financial year 1 Jan – 31 Dec. Template chart of accounts below is a **demo default**; P&T's own chart replaces it later (accounts are editable).

## Chart of accounts (default)
| Code | Account | Type |
|---|---|---|
| 1000 | Cash at bank – Main account | Asset |
| 1010 | Cash in hand | Asset |
| 1100 | Fees receivable – Provider commissions | Asset |
| 1110 | Fees receivable – Client & collateral fees | Asset |
| 1120 | WHT receivable (tax credit) | Asset |
| 1200 | Prepayments | Asset |
| 1300 | Short-term investments (trading with related company) | Asset |
| 1500 | Property, plant & equipment | Asset |
| 1510 | Accumulated depreciation | Asset (contra) |
| 2000 | Referral fees payable | Liability |
| 2100 | Accrued expenses | Liability |
| 2200 | VAT payable | Liability |
| 2210 | Withholding tax payable | Liability |
| 2220 | PAYE payable | Liability |
| 2300 | Income tax payable | Liability |
| 3000 | Share capital | Equity |
| 3100 | Retained earnings | Equity |
| 4000 | Commission income – Providers | Income |
| 4100 | Advisory fee income – Clients | Income |
| 4200 | Collateral negotiation fee income | Income |
| 4300 | Investment income | Income |
| 4900 | Other income | Income |
| 5000 | Referral fee expense | Expense |
| 5100 | Salaries & wages | Expense |
| 5200 | Rent & office costs | Expense |
| 5300 | Professional & legal fees | Expense |
| 5400 | Transport & travel | Expense |
| 5500 | Utilities, internet & phone | Expense |
| 5600 | Bank charges | Expense |
| 5700 | Marketing & business development | Expense |
| 5800 | Depreciation | Expense |
| 5900 | Income tax expense | Expense |

Tax rates (VAT, WHT) are **settings**, not hard-coded.

## Posting rules
- Every journal must balance; posting to a locked period is blocked.
- System entries (fees, receipts, payments) reference their source record and cannot be edited, only reversed.
- Fees are VAT-exclusive: recognition posts Dr Fees receivable (fee + VAT) / Cr Income (fee) / Cr 2200 VAT payable (VAT). Receipts may record WHT deducted by the payer: Dr Bank (net) / Dr 1120 WHT receivable (WHT) / Cr Fees receivable (gross). Defaults VAT 7.5%, WHT 10% (settings).
- No year-end close step: retained earnings shown in reports = opening retained earnings + all prior-year profit, computed on the fly.

## Reports (all: period picker, prior-period comparison, Excel + PDF export with P&T letterhead header)
1. **Trial balance** — account code, name, debit, credit; totals must match.
2. **Statement of profit or loss** — Revenue (4000–4300), Other income, Operating expenses grouped, Profit before tax, Tax, Profit for the period.
3. **Statement of financial position** — Non-current assets, Current assets, Current liabilities, Equity (retained earnings includes current-period profit); must balance.
4. **Statement of cash flows** (indirect method) — Operating (profit adjusted for depreciation and working-capital changes), Investing, Financing; reconciles to cash at bank.
5. Supporting: General ledger, Receivables ageing, Payables listing, Fee income by financier / by referrer.
