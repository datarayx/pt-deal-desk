import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const accountantEmail = process.env.DEMO_ACCOUNTANT_EMAIL;
const accountantPassword = process.env.DEMO_ACCOUNTANT_PASSWORD;
const ceoEmail = process.env.DEMO_CEO_EMAIL;
const ceoPassword = process.env.DEMO_CEO_PASSWORD;

const configured = Boolean(
  url && publishableKey && accountantEmail && accountantPassword && ceoEmail && ceoPassword,
);

const protectedTables = [
  ["clients", "clients"],
  ["individual_profiles", "individual KYC profiles"],
  ["company_profiles", "company KYC profiles"],
  ["company_directors", "company directors"],
  ["kyc_document_types", "KYC document types"],
  ["client_documents", "KYC documents"],
  ["credit_checks", "credit checks"],
  ["external_exposures", "external credit exposures"],
  ["deal_stages", "deal stages"],
  ["deals", "deals"],
  ["deal_requirements", "deal requirements"],
  ["deal_stage_history", "deal stage history"],
  ["deal_documents", "deal documents"],
  ["repayment_schedules", "repayment schedules"],
  ["repayment_reports", "repayment reports"],
] as const;

type TestClient = SupabaseClient<Database>;
type TableName = keyof Database["public"]["Tables"];

async function signIn(email: string, password: string): Promise<TestClient> {
  const client = createClient<Database>(url!, publishableKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Could not sign in ${email}: ${error.message}`);
  if (!data.user) throw new Error(`Supabase returned no user for ${email}`);
  return client;
}

async function countRows(client: TestClient, table: TableName) {
  const { data, error } = await client.from(table).select("id").limit(10);
  if (error) throw new Error(`${table}: ${error.message}`);
  return data?.length ?? 0;
}

describe.skipIf(!configured)("Supabase RLS: accountant access", () => {
  let accountant: TestClient;
  let ceo: TestClient;

  beforeAll(async () => {
    [accountant, ceo] = await Promise.all([
      signIn(accountantEmail!, accountantPassword!),
      signIn(ceoEmail!, ceoPassword!),
    ]);
  });

  it("authenticates the accountant session as the accountant role", async () => {
    const { data, error } = await accountant.auth.getUser();
    expect(error).toBeNull();
    expect(data.user?.app_metadata?.role).toBe("accountant");
  });

  it("lets the CEO read seeded protected records", async () => {
    for (const [table, label] of protectedTables) {
      expect(
        await countRows(ceo, table),
        `${label} should have seeded CEO-visible rows`,
      ).toBeGreaterThan(0);
    }
  });

  it("blocks accountant reads at the database RLS layer", async () => {
    for (const [table, label] of protectedTables) {
      expect(await countRows(accountant, table), `${label} leaked through RLS`).toBe(0);
    }
  });

  it("keeps accountant access limited to finance data and safe fee lines", async () => {
    const [accounts, journals, lines, fees] = await Promise.all([
      accountant.from("accounts").select("id").limit(1),
      accountant.from("journal_entries").select("id").limit(1),
      accountant.from("journal_lines").select("id").limit(1),
      accountant
        .from("v_fee_lines_finance")
        .select("fee_id, deal_reference, client_name, financier_name")
        .limit(1),
    ]);

    for (const result of [accounts, journals, lines, fees]) expect(result.error).toBeNull();
    for (const row of fees.data ?? []) {
      expect(Object.keys(row).sort()).toEqual(
        ["client_name", "deal_reference", "fee_id", "financier_name"].sort(),
      );
    }
  });
});
