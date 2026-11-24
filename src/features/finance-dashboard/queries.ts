import "server-only";

import { requireRole } from "@/lib/auth/session";
import { addDecimalStrings, subtractDecimalStrings, sumDecimalStrings } from "@/lib/money/decimal";
import { lagosToday } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { monthRange, previousMonth, type DashboardKpi } from "@/features/dashboard/logic";

export type FinanceDashboardData = {
  monthLabel: string;
  kpis: {
    cashBalance: DashboardKpi;
    receivables: DashboardKpi;
    payables: DashboardKpi;
    income: DashboardKpi;
    expenses: DashboardKpi;
  };
  pnl: {
    income: string;
    expenses: string;
    profit: string;
    priorIncome: string;
    priorExpenses: string;
    priorProfit: string;
  };
};

function periodTotal(lines: FinanceLine[], from: string, to: string, type: "income" | "expense") {
  return sumDecimalStrings(
    lines
      .filter(
        (line) => line.entry_date >= from && line.entry_date <= to && line.account_type === type,
      )
      .map((line) =>
        type === "income"
          ? subtractDecimalStrings(line.credit, line.debit)
          : subtractDecimalStrings(line.debit, line.credit),
      ),
  );
}

type FinanceLine = {
  entry_date: string;
  account_type: string;
  account_subtype: string | null;
  debit: string;
  credit: string;
};

export async function getFinanceDashboardData(): Promise<FinanceDashboardData> {
  await requireRole("ceo", "accountant");
  const supabase = await createSupabaseServerClient();
  const today = lagosToday();
  const current = monthRange(today);
  const prior = previousMonth(current);
  const [accountsResult, balancesResult, feesResult, entriesResult] = await Promise.all([
    supabase.from("accounts").select("id, subtype, type"),
    supabase.from("v_account_balances").select("account_id, balance::text"),
    supabase.rpc("fee_lines_finance"),
    supabase.from("journal_entries").select("id, entry_date, source, source_id").eq("posted", true),
  ]);
  if (accountsResult.error) throw new Error(accountsResult.error.message);
  if (balancesResult.error) throw new Error(balancesResult.error.message);
  if (feesResult.error) throw new Error(feesResult.error.message);
  if (entriesResult.error) throw new Error(entriesResult.error.message);

  const entryIds = (entriesResult.data ?? []).map((entry) => entry.id);
  const linesResult = entryIds.length
    ? await supabase
        .from("journal_lines")
        .select("entry_id, debit::text, credit::text, accounts(type, subtype)")
        .in("entry_id", entryIds)
    : { data: [], error: null };
  if (linesResult.error) throw new Error(linesResult.error.message);
  const entriesById = new Map((entriesResult.data ?? []).map((entry) => [entry.id, entry]));
  const lines: FinanceLine[] = (linesResult.data ?? []).flatMap((line) => {
    const entry = entriesById.get(line.entry_id);
    if (!entry || !line.accounts) return [];
    return [
      {
        entry_date: entry.entry_date,
        account_type: line.accounts.type,
        account_subtype: line.accounts.subtype,
        debit: String(line.debit ?? "0.00"),
        credit: String(line.credit ?? "0.00"),
      },
    ];
  });

  const balanceByAccount = new Map(
    (balancesResult.data ?? []).map((row) => [row.account_id, String(row.balance ?? "0.00")]),
  );
  const cashAccounts = (accountsResult.data ?? []).filter(
    (account) => account.subtype === "bank" || account.subtype === "cash",
  );
  const cashBalance = sumDecimalStrings(
    cashAccounts.map((account) => balanceByAccount.get(account.id) ?? "0.00"),
  );
  const cashMovement = sumDecimalStrings(
    lines
      .filter((line) => line.account_subtype === "bank" || line.account_subtype === "cash")
      .map((line) => subtractDecimalStrings(line.debit, line.credit)),
  );
  const cashPrior = subtractDecimalStrings(cashBalance, cashMovement);

  const fees = (feesResult.data ?? []).flatMap((fee) => {
    if (!fee.fee_id || !fee.fee_kind || !fee.status) return [];
    return [
      {
        id: fee.fee_id,
        fee_kind: fee.fee_kind,
        status: fee.status,
        earned_at: fee.earned_at,
        amount: addDecimalStrings(
          String(fee.computed_amount ?? "0.00"),
          String(fee.vat_amount ?? "0.00"),
        ),
        base: String(fee.computed_amount ?? "0.00"),
      },
    ];
  });
  const settlementDates = new Map(
    (entriesResult.data ?? []).flatMap((entry) =>
      (entry.source === "receipt" || entry.source === "payment") && entry.source_id
        ? [[entry.source_id, entry.entry_date] as const]
        : [],
    ),
  );
  const isReceivedAt = (feeId: string, cutoff: string) => {
    const date = settlementDates.get(feeId);
    return Boolean(date && date <= cutoff);
  };
  const receivableAt = (cutoff: string) =>
    sumDecimalStrings(
      fees
        .filter(
          (fee) =>
            fee.fee_kind !== "referral_fee" &&
            fee.earned_at?.slice(0, 10) <= cutoff &&
            !isReceivedAt(fee.id, cutoff),
        )
        .map((fee) => fee.amount),
    );
  const payableAt = (cutoff: string) =>
    sumDecimalStrings(
      fees
        .filter(
          (fee) =>
            fee.fee_kind === "referral_fee" &&
            fee.earned_at?.slice(0, 10) <= cutoff &&
            !isReceivedAt(fee.id, cutoff),
        )
        .map((fee) => fee.base),
    );
  const income = periodTotal(lines, current.from, current.to, "income");
  const expenses = periodTotal(lines, current.from, current.to, "expense");
  const priorIncome = periodTotal(lines, prior.from, prior.to, "income");
  const priorExpenses = periodTotal(lines, prior.from, prior.to, "expense");
  const profit = subtractDecimalStrings(income, expenses);
  const priorProfit = subtractDecimalStrings(priorIncome, priorExpenses);
  return {
    monthLabel: current.label,
    kpis: {
      cashBalance: { current: cashBalance, previous: cashPrior },
      receivables: { current: receivableAt(today), previous: receivableAt(prior.to) },
      payables: { current: payableAt(today), previous: payableAt(prior.to) },
      income: { current: income, previous: priorIncome },
      expenses: { current: expenses, previous: priorExpenses },
    },
    pnl: { income, expenses, profit, priorIncome, priorExpenses, priorProfit },
  };
}
