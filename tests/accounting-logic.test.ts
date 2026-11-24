import { describe, expect, it } from "vitest";

import {
  buildFeeJournalLines,
  buildExpenseJournalLines,
  buildReceiptJournalLines,
  buildReferralPaymentJournalLines,
  calculateFeeAmount,
  calculateVat,
  journalBalance,
  journalValidationError,
} from "@/features/accounting/logic";

describe("fee logic", () => {
  it("calculates percentage and flat fees to kobo without float drift", () => {
    expect(calculateFeeAmount("percent", "1.5", "250000.00")).toBe("3750.00");
    expect(calculateFeeAmount("percent", "1.5", "123.45")).toBe("1.85");
    expect(calculateFeeAmount("flat", "250000.555", "0")).toBe("250000.56");
    expect(calculateVat("3750.00", "7.5")).toBe("281.25");
  });

  it("builds VAT-exclusive income journals for client/provider fees", () => {
    expect(buildFeeJournalLines("provider_commission", "3750.00")).toEqual([
      { account: "1100", debit: "4031.25", credit: "0.00", description: "Fee receivable" },
      { account: "4000", debit: "0.00", credit: "3750.00", description: "Fee income" },
      { account: "2200", debit: "0.00", credit: "281.25", description: "VAT" },
    ]);
  });

  it("keeps referral fee recognition as a payable with no VAT line", () => {
    const lines = buildFeeJournalLines("referral_fee", "1250.00");
    expect(lines).toHaveLength(2);
    expect(journalBalance(lines)).toMatchObject({
      debit: "1250.00",
      credit: "1250.00",
      balanced: true,
    });
  });

  it("builds receipt and referral payment journals with the documented accounts", () => {
    expect(buildReceiptJournalLines("client_fee", "1075.00", "100.00")).toEqual([
      { account: "1000", debit: "975.00", credit: "0.00", description: "Fee received" },
      { account: "1120", debit: "100.00", credit: "0.00", description: "WHT deducted by payer" },
      { account: "1110", debit: "0.00", credit: "1075.00", description: "Fee receivable settled" },
    ]);
    expect(buildReferralPaymentJournalLines("1250.00")).toEqual([
      { account: "2000", debit: "1250.00", credit: "0.00", description: "Referral fee paid" },
      { account: "1000", debit: "0.00", credit: "1250.00", description: "Paid from bank" },
    ]);
  });

  it("builds quick expense entries as expense debit and bank credit", () => {
    const lines = buildExpenseJournalLines("5200", "50000.00", "November rent");
    expect(lines).toEqual([
      { account: "5200", debit: "50000.00", credit: "0.00", description: "November rent" },
      { account: "1000", debit: "0.00", credit: "50000.00", description: "Paid from bank" },
    ]);
    expect(journalBalance(lines).balanced).toBe(true);
  });
});

describe("journal logic", () => {
  it("accepts balanced one-sided lines", () => {
    expect(
      journalValidationError([
        { account: "1000", debit: "100.00", credit: "" },
        { account: "4900", debit: "", credit: "100.00" },
      ]),
    ).toBeNull();
  });

  it("refuses unbalanced and double-sided lines", () => {
    expect(
      journalValidationError([
        { account: "1000", debit: "100.00", credit: "" },
        { account: "4900", debit: "", credit: "99.99" },
      ]),
    ).toContain("out of balance");
    expect(
      journalValidationError([
        { account: "1000", debit: "100.00", credit: "1.00" },
        { account: "4900", debit: "", credit: "99.00" },
      ]),
    ).toContain("either a debit or a credit");
  });
});
