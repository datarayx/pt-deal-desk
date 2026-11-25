import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

import {
  buildBalanceSheet,
  buildTrialBalance,
  type ReportAccount,
  type ReportLine,
} from "@/features/reports/logic";
import type { Database } from "@/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const ceoEmail = process.env.DEMO_CEO_EMAIL;
const ceoPassword = process.env.DEMO_CEO_PASSWORD;
const configured = Boolean(url && publishableKey && ceoEmail && ceoPassword);

type TestClient = SupabaseClient<Database>;
type Deal = {
  id: string;
  reference: string;
  amount_disbursed: string | number | null;
  tenor_months: number | null;
  interest_rate_monthly: string | number | null;
  repayment_frequency: "monthly" | "quarterly" | "bullet" | null;
  first_repayment_date: string | null;
};

function cents(value: string | number | null | undefined): bigint {
  const raw = String(value ?? "0").trim();
  const [whole = "0", fraction = ""] = raw.split(".");
  return BigInt(whole) * BigInt(100) + BigInt((fraction + "00").slice(0, 2));
}

function roundedDivide(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / BigInt(2)) / denominator;
}

function isoDatePlusMonths(date: string, months: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCMonth(value.getUTCMonth() + months);
  return value.toISOString().slice(0, 10);
}

async function signIn(): Promise<TestClient> {
  const client = createClient<Database>(url!, publishableKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: ceoEmail!,
    password: ceoPassword!,
  });
  if (error) throw new Error(`Could not sign in CEO: ${error.message}`);
  if (!data.user) throw new Error("Supabase returned no CEO user");
  return client;
}

describe.skipIf(!configured)("Supabase money invariants on seeded data", () => {
  let ceo: TestClient;

  beforeAll(async () => {
    ceo = await signIn();
  });

  it("generates the expected repayment count, dates, principal and flat interest", async () => {
    const { data: deals, error: dealsError } = await ceo
      .from("deals")
      .select(
        "id, reference, amount_disbursed, tenor_months, interest_rate_monthly, repayment_frequency, first_repayment_date",
      )
      .not("amount_disbursed", "is", null);
    expect(dealsError).toBeNull();
    expect(deals?.length ?? 0).toBeGreaterThan(0);

    for (const deal of (deals ?? []) as Deal[]) {
      const { data: schedules, error } = await ceo
        .from("repayment_schedules")
        .select("instalment_no, due_date, principal_due, interest_due, total_due")
        .eq("deal_id", deal.id)
        .order("instalment_no");
      expect(error).toBeNull();
      expect(deal.tenor_months).not.toBeNull();
      expect(deal.interest_rate_monthly).not.toBeNull();
      expect(deal.first_repayment_date).not.toBeNull();

      const count =
        deal.repayment_frequency === "monthly"
          ? deal.tenor_months!
          : deal.repayment_frequency === "quarterly"
            ? Math.ceil(deal.tenor_months! / 3)
            : 1;
      expect(schedules).toHaveLength(count);

      const principal = (schedules ?? []).reduce(
        (sum, row) => sum + cents(row.principal_due),
        BigInt(0),
      );
      const interest = (schedules ?? []).reduce(
        (sum, row) => sum + cents(row.interest_due),
        BigInt(0),
      );
      const expectedInterest = roundedDivide(
        cents(deal.amount_disbursed) *
          BigInt(Math.round(Number(deal.interest_rate_monthly) * 1000)) *
          BigInt(deal.tenor_months!),
        BigInt(100000),
      );
      expect(principal).toBe(cents(deal.amount_disbursed));
      expect(interest).toBe(expectedInterest);

      const step =
        deal.repayment_frequency === "monthly"
          ? 1
          : deal.repayment_frequency === "quarterly"
            ? 3
            : 0;
      for (const [index, row] of (schedules ?? []).entries()) {
        expect(row.instalment_no).toBe(index + 1);
        expect(row.due_date).toBe(isoDatePlusMonths(deal.first_repayment_date!, index * step));
        expect(cents(row.total_due)).toBe(cents(row.principal_due) + cents(row.interest_due));
      }
    }
  });

  it("recognises fees according to their configured trigger and only once", async () => {
    const [
      { data: deals, error: dealsError },
      { data: fees, error: feesError },
      { data: reports, error: reportsError },
    ] = await Promise.all([
      ceo.from("deals").select("id, amount_disbursed").not("amount_disbursed", "is", null),
      ceo
        .from("deal_fees")
        .select(
          "id, deal_id, fee_kind, trigger, status, computed_amount, earned_at, journal_entry_id, idempotency_key",
        ),
      ceo.from("repayment_reports").select("schedule_id").eq("confirmed_by_financier", true),
    ]);
    expect(dealsError).toBeNull();
    expect(feesError).toBeNull();
    expect(reportsError).toBeNull();

    const scheduleIds = [...new Set((reports ?? []).map((row) => row.schedule_id))];
    const { data: schedules, error: schedulesError } = scheduleIds.length
      ? await ceo.from("repayment_schedules").select("id, deal_id").in("id", scheduleIds)
      : { data: [], error: null };
    expect(schedulesError).toBeNull();
    const confirmedDeals = new Set((schedules ?? []).map((row) => row.deal_id));
    const disbursedDeals = new Set((deals ?? []).map((deal) => deal.id));
    const journalIds = new Set<string>();

    for (const fee of fees ?? []) {
      const recognised = ["earned", "received", "paid"].includes(fee.status);
      if (recognised) {
        expect(fee.computed_amount).not.toBeNull();
        expect(fee.earned_at).not.toBeNull();
        expect(fee.journal_entry_id).not.toBeNull();
        expect(fee.idempotency_key).toBe(`fee:${fee.id}`);
        expect(journalIds.has(fee.journal_entry_id!)).toBe(false);
        journalIds.add(fee.journal_entry_id!);
      }
      if (fee.trigger === "on_disbursement" && disbursedDeals.has(fee.deal_id)) {
        expect(["earned", "received", "paid", "cancelled"]).toContain(fee.status);
      }
      if (fee.trigger === "on_first_repayment" && confirmedDeals.has(fee.deal_id)) {
        expect(["earned", "received", "paid"]).toContain(fee.status);
      }
    }
    expect(fees?.length ?? 0).toBeGreaterThan(0);
  });

  it("keeps every posted journal and the balanced statements balanced", async () => {
    const [accountsResult, entriesResult, linesResult] = await Promise.all([
      ceo.from("accounts").select("id, code, name, type, subtype"),
      ceo.from("journal_entries").select("id, entry_date, reference, posted").eq("posted", true),
      ceo.from("journal_lines").select("entry_id, account_id, debit, credit"),
    ]);
    expect(accountsResult.error).toBeNull();
    expect(entriesResult.error).toBeNull();
    expect(linesResult.error).toBeNull();

    const postedIds = new Set((entriesResult.data ?? []).map((entry) => entry.id));
    const linesByEntry = new Map<string, { debit: bigint; credit: bigint }>();
    for (const line of linesResult.data ?? []) {
      if (!postedIds.has(line.entry_id)) continue;
      const total = linesByEntry.get(line.entry_id) ?? { debit: BigInt(0), credit: BigInt(0) };
      total.debit += cents(line.debit);
      total.credit += cents(line.credit);
      linesByEntry.set(line.entry_id, total);
    }
    for (const [entryId, total] of linesByEntry) {
      expect(total.debit, `journal ${entryId} debit/credit mismatch`).toBe(total.credit);
      expect(total.debit).toBeGreaterThan(BigInt(0));
    }

    const accountMap = new Map((accountsResult.data ?? []).map((account) => [account.id, account]));
    const entryMap = new Map((entriesResult.data ?? []).map((entry) => [entry.id, entry]));
    const reportLines: ReportLine[] = (linesResult.data ?? [])
      .filter((line) => postedIds.has(line.entry_id))
      .map((line) => {
        const account = accountMap.get(line.account_id)!;
        const entry = entryMap.get(line.entry_id)!;
        return {
          entry_date: entry.entry_date,
          reference: entry.reference,
          account_code: account.code,
          account_name: account.name,
          account_type: account.type,
          account_subtype: account.subtype,
          debit: String(line.debit),
          credit: String(line.credit),
        };
      });
    const accounts = (accountsResult.data ?? []) as ReportAccount[];
    const trial = buildTrialBalance(reportLines, accounts, {
      from: "0000-01-01",
      to: "9999-12-31",
      label: "All posted activity",
    });
    const asOf = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
    const position = buildBalanceSheet(reportLines, accounts, asOf);
    expect(trial.debitTotal).toBe(trial.creditTotal);
    expect(position.difference).toBe("0.00");
  });
});
