import { addDecimalStrings, subtractDecimalStrings, sumDecimalStrings } from "@/lib/money/decimal";

export type AccountingFeeKind =
  "provider_commission" | "client_fee" | "collateral_fee" | "referral_fee";
export type AccountingFeeBasis = "percent" | "flat";

export type JournalLineInput = {
  account: string;
  debit: string;
  credit: string;
  description?: string | null;
};

export type JournalBalance = {
  debit: string;
  credit: string;
  difference: string;
  balanced: boolean;
};

function scaled(value: string, decimals: number): bigint {
  const clean = value.trim();
  if (!/^\d+(\.\d+)?$/.test(clean)) return BigInt(0);
  const [whole = "0", fraction = ""] = clean.split(".");
  return (
    BigInt(whole) * BigInt(10) ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, "0").slice(0, decimals) || "0")
  );
}

function formatMoney(cents: bigint): string {
  return `${cents / BigInt(100)}.${(cents % BigInt(100)).toString().padStart(2, "0")}`;
}

/** Round a positive decimal to kobo using half-up rounding. */
export function roundMoney(value: string): string {
  const [whole = "0", fraction = ""] = value.trim().split(".");
  const cents = BigInt(whole) * BigInt(100) + BigInt((fraction + "00").slice(0, 2) || "0");
  return formatMoney(cents + (Number((fraction + "000").slice(2, 3)) >= 5 ? BigInt(1) : BigInt(0)));
}

/** Calculate a fee without floating-point arithmetic. Percent values are percentages, not fractions. */
export function calculateFeeAmount(
  basis: AccountingFeeBasis,
  value: string,
  baseAmount: string,
): string {
  if (basis === "flat") return roundMoney(value);
  const numerator = scaled(baseAmount, 2) * scaled(value, 4);
  const denominator = BigInt(100) * BigInt(100) * BigInt(100);
  return formatMoney((numerator + denominator / BigInt(2)) / denominator);
}

export function calculateVat(amount: string, vatRate: string): string {
  return calculateFeeAmount("percent", vatRate, amount);
}

export function buildFeeJournalLines(
  feeKind: AccountingFeeKind,
  amount: string,
  vatRate = "7.5",
): JournalLineInput[] {
  if (feeKind === "referral_fee") {
    return [
      { account: "5000", debit: amount, credit: "0.00", description: "Referral fee" },
      { account: "2000", debit: "0.00", credit: amount, description: "Referral fee payable" },
    ];
  }
  const vat = calculateVat(amount, vatRate);
  const receivable = feeKind === "provider_commission" ? "1100" : "1110";
  const income =
    feeKind === "provider_commission" ? "4000" : feeKind === "client_fee" ? "4100" : "4200";
  const lines: JournalLineInput[] = [
    {
      account: receivable,
      debit: addDecimalStrings(amount, vat),
      credit: "0.00",
      description: "Fee receivable",
    },
    { account: income, debit: "0.00", credit: amount, description: "Fee income" },
  ];
  if (vat !== "0.00")
    lines.push({ account: "2200", debit: "0.00", credit: vat, description: "VAT" });
  return lines;
}

export function buildReceiptJournalLines(
  feeKind: AccountingFeeKind,
  grossAmount: string,
  whtAmount = "0.00",
): JournalLineInput[] {
  const netAmount = subtractDecimalStrings(grossAmount, whtAmount);
  return [
    { account: "1000", debit: netAmount, credit: "0.00", description: "Fee received" },
    ...(whtAmount !== "0.00"
      ? [
          {
            account: "1120",
            debit: whtAmount,
            credit: "0.00",
            description: "WHT deducted by payer",
          },
        ]
      : []),
    {
      account: feeKind === "provider_commission" ? "1100" : "1110",
      debit: "0.00",
      credit: grossAmount,
      description: "Fee receivable settled",
    },
  ];
}

export function buildReferralPaymentJournalLines(amount: string): JournalLineInput[] {
  return [
    { account: "2000", debit: amount, credit: "0.00", description: "Referral fee paid" },
    { account: "1000", debit: "0.00", credit: amount, description: "Paid from bank" },
  ];
}

export function buildExpenseJournalLines(
  expenseAccount: string,
  amount: string,
  description: string,
): JournalLineInput[] {
  return [
    { account: expenseAccount, debit: amount, credit: "0.00", description },
    { account: "1000", debit: "0.00", credit: amount, description: "Paid from bank" },
  ];
}

export function journalBalance(lines: JournalLineInput[]): JournalBalance {
  const debit = sumDecimalStrings(lines.map((line) => line.debit));
  const credit = sumDecimalStrings(lines.map((line) => line.credit));
  const difference = subtractDecimalStrings(debit, credit);
  return {
    debit,
    credit,
    difference,
    balanced: lines.length >= 2 && debit !== "0.00" && difference === "0.00",
  };
}

export function journalLineError(line: JournalLineInput): string | null {
  const debit = line.debit.trim();
  const credit = line.credit.trim();
  const hasDebit = /^\d+(\.\d{1,2})?$/.test(debit) && Number(debit) > 0;
  const hasCredit = /^\d+(\.\d{1,2})?$/.test(credit) && Number(credit) > 0;
  if (hasDebit === hasCredit) return "Enter either a debit or a credit amount.";
  return null;
}

export function journalValidationError(lines: JournalLineInput[]): string | null {
  if (lines.length < 2) return "A journal needs at least two lines.";
  const lineError = lines.map(journalLineError).find(Boolean);
  if (lineError) return lineError ?? null;
  const balance = journalBalance(lines);
  return balance.balanced ? null : `Journal is out of balance by ₦${balance.difference}.`;
}
