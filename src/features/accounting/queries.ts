import "server-only";

import { requireRole } from "@/lib/auth/session";
import { sumDecimalStrings } from "@/lib/money/decimal";
import { lagosToday } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

export type AccountRow = {
  id: string;
  code: string;
  name: string;
  type: Enums["account_type"];
  subtype: string | null;
  parent_id: string | null;
  is_system: boolean;
  is_active: boolean;
  total_debit: string;
  total_credit: string;
  balance: string;
};

export type JournalLineRow = {
  id: string;
  account_id: string;
  account_code: string;
  account_name: string;
  debit: string;
  credit: string;
  description: string | null;
};

export type JournalRow = {
  id: string;
  entry_date: string;
  period: string;
  reference: string | null;
  memo: string | null;
  source: Enums["journal_source"];
  posted: boolean;
  posted_at: string | null;
  lines: JournalLineRow[];
  debit_total: string;
  credit_total: string;
};

export type PeriodRow = {
  period: string;
  is_locked: boolean;
  locked_at: string | null;
  entry_count: number;
  posted_count: number;
};

export async function getAccountsPageData(): Promise<AccountRow[]> {
  await requireRole("ceo", "accountant");
  const supabase = await createSupabaseServerClient();
  const [accountsResult, balancesResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, code, name, type, subtype, parent_id, is_system, is_active")
      .order("code"),
    supabase
      .from("v_account_balances")
      .select("account_id, total_debit::text, total_credit::text, balance::text"),
  ]);
  if (accountsResult.error) throw new Error(accountsResult.error.message);
  if (balancesResult.error) throw new Error(balancesResult.error.message);
  const balances = new Map(
    (balancesResult.data ?? []).map((row) => [row.account_id, row] as const),
  );
  return accountsResult.data.map((account) => {
    const balance = balances.get(account.id);
    return {
      ...account,
      total_debit: String(balance?.total_debit ?? "0.00"),
      total_credit: String(balance?.total_credit ?? "0.00"),
      balance: String(balance?.balance ?? "0.00"),
    };
  });
}

export async function getJournalsPageData(): Promise<JournalRow[]> {
  await requireRole("ceo", "accountant");
  const supabase = await createSupabaseServerClient();
  const entriesResult = await supabase
    .from("journal_entries")
    .select("id, entry_date, period, reference, memo, source, posted, posted_at")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (entriesResult.error) throw new Error(entriesResult.error.message);
  const ids = entriesResult.data.map((entry) => entry.id);
  const linesResult = ids.length
    ? await supabase
        .from("journal_lines")
        .select(
          "id, entry_id, account_id, debit::text, credit::text, description, accounts(code, name)",
        )
        .in("entry_id", ids)
        .order("created_at")
    : { data: [], error: null };
  if (linesResult.error) throw new Error(linesResult.error.message);
  const linesByEntry = new Map<string, JournalLineRow[]>();
  for (const line of linesResult.data ?? []) {
    const entryLines = linesByEntry.get(line.entry_id) ?? [];
    entryLines.push({
      id: line.id,
      account_id: line.account_id,
      account_code: line.accounts?.code ?? "—",
      account_name: line.accounts?.name ?? "Unknown account",
      debit: String(line.debit),
      credit: String(line.credit),
      description: line.description,
    });
    linesByEntry.set(line.entry_id, entryLines);
  }
  return entriesResult.data.map((entry) => {
    const lines = linesByEntry.get(entry.id) ?? [];
    return {
      ...entry,
      lines,
      debit_total: sumDecimalStrings(lines.map((line) => line.debit)),
      credit_total: sumDecimalStrings(lines.map((line) => line.credit)),
    };
  });
}

export async function getPeriodsPageData(): Promise<PeriodRow[]> {
  await requireRole("ceo", "accountant");
  const supabase = await createSupabaseServerClient();
  const [periodsResult, entriesResult] = await Promise.all([
    supabase.from("periods").select("period, is_locked, locked_at"),
    supabase.from("journal_entries").select("period, posted"),
  ]);
  if (periodsResult.error) throw new Error(periodsResult.error.message);
  if (entriesResult.error) throw new Error(entriesResult.error.message);

  const today = lagosToday();
  const [year, month] = today.split("-").map(Number);
  const periods = new Set<string>(periodsResult.data.map((row) => row.period));
  for (let offset = 0; offset < 12; offset += 1) {
    const date = new Date(Date.UTC(year, month - 1 - offset, 1));
    periods.add(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const periodMap = new Map(periodsResult.data.map((row) => [row.period, row]));
  return [...periods]
    .sort((a, b) => b.localeCompare(a))
    .map((period) => {
      const entries = entriesResult.data.filter((entry) => entry.period === period);
      const saved = periodMap.get(period);
      return {
        period,
        is_locked: saved?.is_locked ?? false,
        locked_at: saved?.locked_at ?? null,
        entry_count: entries.length,
        posted_count: entries.filter((entry) => entry.posted).length,
      };
    });
}
