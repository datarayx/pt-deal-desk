import "server-only";

import { companyValues } from "@/features/settings/settings-values";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { ReportAccount, ReportLine } from "@/features/reports/logic";

type Enums = Database["public"]["Enums"];

export type ReportCompany = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
};

export type ReportData = { accounts: ReportAccount[]; lines: ReportLine[]; company: ReportCompany };

export async function getReportsPageData(): Promise<ReportData> {
  await requireRole("ceo", "accountant");
  const supabase = await createSupabaseServerClient();
  const [accountsResult, entriesResult, settingsResult] = await Promise.all([
    supabase.from("accounts").select("code, name, type, subtype").order("code"),
    supabase
      .from("journal_entries")
      .select("id, entry_date, reference, posted")
      .eq("posted", true)
      .order("entry_date"),
    supabase.from("settings").select("value").eq("key", "company_profile").maybeSingle(),
  ]);
  if (accountsResult.error) throw new Error(accountsResult.error.message);
  if (entriesResult.error) throw new Error(entriesResult.error.message);
  if (settingsResult.error) throw new Error(settingsResult.error.message);
  const entryIds = entriesResult.data.map((entry) => entry.id);
  const linesResult = entryIds.length
    ? await supabase
        .from("journal_lines")
        .select("entry_id, debit::text, credit::text, accounts(code, name, type, subtype)")
        .in("entry_id", entryIds)
    : { data: [], error: null };
  if (linesResult.error) throw new Error(linesResult.error.message);
  const entries = new Map(entriesResult.data.map((entry) => [entry.id, entry]));
  const accounts = accountsResult.data as ReportAccount[];
  const lines: ReportLine[] = (linesResult.data ?? []).flatMap((line) => {
    const entry = entries.get(line.entry_id);
    const account = line.accounts as {
      code: string;
      name: string;
      type: Enums["account_type"];
      subtype: string | null;
    } | null;
    if (!entry || !account) return [];
    return [
      {
        entry_date: entry.entry_date,
        reference: entry.reference,
        account_code: account.code,
        account_name: account.name,
        account_type: account.type,
        account_subtype: account.subtype,
        debit: String(line.debit),
        credit: String(line.credit),
      },
    ];
  });
  const company = companyValues.parse(settingsResult.data?.value ?? {});
  return {
    accounts,
    lines,
    company: {
      name: company.name,
      address: company.address ?? null,
      phone: company.phone ?? null,
      email: company.email ?? null,
    },
  };
}
