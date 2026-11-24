import { describe, expect, it } from "vitest";

import {
  buildBalanceSheet,
  buildTrialBalance,
  type ReportAccount,
  type ReportLine,
} from "@/features/reports/logic";

const seedAccounts: ReportAccount[] = [
  { code: "1000", name: "Cash at bank – Main account", type: "asset", subtype: "bank" },
  {
    code: "1100",
    name: "Fees receivable – Provider commissions",
    type: "asset",
    subtype: "receivable",
  },
  { code: "1120", name: "WHT receivable (tax credit)", type: "asset", subtype: "tax_credit" },
  { code: "2200", name: "VAT payable", type: "liability", subtype: "tax" },
  { code: "3100", name: "Retained earnings", type: "equity", subtype: "retained_earnings" },
  { code: "4000", name: "Commission income – Providers", type: "income", subtype: "revenue" },
  { code: "5200", name: "Rent & office costs", type: "expense", subtype: "operating" },
];

// A compact representation of the seeded books: opening capital, an earned fee with VAT,
// a WHT-bearing receipt, and a bank-paid operating expense.
const seedLines: ReportLine[] = [
  {
    entry_date: "2026-01-01",
    reference: "OB-2026",
    account_code: "1000",
    account_name: "Cash at bank – Main account",
    account_type: "asset",
    account_subtype: "bank",
    debit: "60000000.00",
    credit: "0.00",
  },
  {
    entry_date: "2026-01-01",
    reference: "OB-2026",
    account_code: "3100",
    account_name: "Retained earnings",
    account_type: "equity",
    account_subtype: "retained_earnings",
    debit: "0.00",
    credit: "60000000.00",
  },
  {
    entry_date: "2026-01-10",
    reference: "FEE-1",
    account_code: "1100",
    account_name: "Fees receivable – Provider commissions",
    account_type: "asset",
    account_subtype: "receivable",
    debit: "1075.00",
    credit: "0.00",
  },
  {
    entry_date: "2026-01-10",
    reference: "FEE-1",
    account_code: "4000",
    account_name: "Commission income – Providers",
    account_type: "income",
    account_subtype: "revenue",
    debit: "0.00",
    credit: "1000.00",
  },
  {
    entry_date: "2026-01-10",
    reference: "FEE-1",
    account_code: "2200",
    account_name: "VAT payable",
    account_type: "liability",
    account_subtype: "tax",
    debit: "0.00",
    credit: "75.00",
  },
  {
    entry_date: "2026-01-20",
    reference: "REC-1",
    account_code: "1000",
    account_name: "Cash at bank – Main account",
    account_type: "asset",
    account_subtype: "bank",
    debit: "975.00",
    credit: "0.00",
  },
  {
    entry_date: "2026-01-20",
    reference: "REC-1",
    account_code: "1120",
    account_name: "WHT receivable (tax credit)",
    account_type: "asset",
    account_subtype: "tax_credit",
    debit: "100.00",
    credit: "0.00",
  },
  {
    entry_date: "2026-01-20",
    reference: "REC-1",
    account_code: "1100",
    account_name: "Fees receivable – Provider commissions",
    account_type: "asset",
    account_subtype: "receivable",
    debit: "0.00",
    credit: "1075.00",
  },
  {
    entry_date: "2026-01-25",
    reference: "EXP-2026-01",
    account_code: "5200",
    account_name: "Rent & office costs",
    account_type: "expense",
    account_subtype: "operating",
    debit: "100.00",
    credit: "0.00",
  },
  {
    entry_date: "2026-01-25",
    reference: "EXP-2026-01",
    account_code: "1000",
    account_name: "Cash at bank – Main account",
    account_type: "asset",
    account_subtype: "bank",
    debit: "0.00",
    credit: "100.00",
  },
];

describe("seed financial reports", () => {
  it("keeps the trial balance balanced", () => {
    const report = buildTrialBalance(seedLines, seedAccounts, {
      from: "2026-01-01",
      to: "2026-01-31",
      label: "January 2026",
    });
    expect(report.debitTotal).toBe(report.creditTotal);
    expect(report.debitTotal).toBe("60001075.00");
  });

  it("keeps the statement of financial position balanced", () => {
    const report = buildBalanceSheet(seedLines, seedAccounts, "2026-01-31");
    expect(report.difference).toBe("0.00");
    expect(report.totalAssets).toBe("60000975.00");
    expect(report.totalLiabilities).toBe("75.00");
    expect(report.totalEquity).toBe("60000900.00");
  });
});
