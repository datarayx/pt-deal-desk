import "server-only";

import {
  companyValues,
  feeValues,
  reminderValues,
  type CompanyValues,
  type FeeValues,
  type ReminderValues,
} from "@/features/settings/settings-values";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Server-side reads for the Settings area. Every function re-checks the CEO role; RLS enforces
// the same rule in the database. Errors are thrown and caught by settings/error.tsx.

export type StageRow = {
  id: string;
  name: string;
  sort_order: number;
  is_terminal: boolean;
  color: string | null;
  system_key: string | null;
  deal_count: number;
};

export async function getDealStages(): Promise<StageRow[]> {
  await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("deal_stages")
    // Explicit FK: deal_stage_history also links stages and deals
    .select(
      "id, name, sort_order, is_terminal, color, system_key, deals!deals_stage_id_fkey(count)",
    )
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data.map(({ deals, ...s }) => ({ ...s, deal_count: deals[0]?.count ?? 0 }));
}

export type FacilityTypeRow = { id: string; name: string; deal_count: number };

export async function getFacilityTypes(): Promise<FacilityTypeRow[]> {
  await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("facility_types")
    .select("id, name, deals(count)")
    .order("name");
  if (error) throw new Error(error.message);
  return data.map(({ deals, ...f }) => ({ ...f, deal_count: deals[0]?.count ?? 0 }));
}

export type KycDocTypeRow = {
  id: string;
  client_type: "individual" | "company";
  name: string;
  is_required: boolean;
  has_expiry: boolean;
  sort_order: number;
  document_count: number;
};

export async function getKycDocTypes(): Promise<KycDocTypeRow[]> {
  await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("kyc_document_types")
    .select("id, client_type, name, is_required, has_expiry, sort_order, client_documents(count)")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data.map(({ client_documents, ...k }) => ({
    ...k,
    document_count: client_documents[0]?.count ?? 0,
  }));
}

export type RecipientRow = {
  id: string;
  name: string;
  title: string | null;
  email: string;
  alert_types: ("due_soon" | "due_today" | "overdue" | "stale_deal")[];
  is_active: boolean;
};

export async function getRecipients(): Promise<RecipientRow[]> {
  await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notification_recipients")
    .select("id, name, title, email, alert_types, is_active")
    .order("name");
  if (error) throw new Error(error.message);
  return data;
}

async function readSettings(keys: string[]): Promise<Record<string, unknown>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("settings").select("key, value").in("key", keys);
  if (error) throw new Error(error.message);
  return Object.fromEntries(data.map((row) => [row.key, row.value]));
}

export async function getReminderSettings(): Promise<ReminderValues> {
  await requireRole("ceo");
  return reminderValues.parse(
    await readSettings(["reminder_days_before_due", "overdue_email_weekdays", "stale_deal_days"]),
  );
}

export async function getFeeSettings(): Promise<FeeValues> {
  await requireRole("ceo");
  return feeValues.parse(
    await readSettings(["vat_rate_pct", "wht_rate_pct", "referral_fee_trigger", "fee_defaults"]),
  );
}

export async function getCompanyProfile(): Promise<CompanyValues & { logo_url: string | null }> {
  await requireRole("ceo");
  const values = companyValues.parse(
    (await readSettings(["company_profile"])).company_profile ?? {},
  );
  let logo_url: string | null = null;
  if (values.logo_path) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.storage
      .from("branding")
      .createSignedUrl(values.logo_path, 60 * 60);
    logo_url = data?.signedUrl ?? null;
  }
  return { ...values, logo_url };
}

export type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: "ceo" | "accountant";
  is_active: boolean;
  last_sign_in_at: string | null;
  invited_pending: boolean;
};

export async function getUsers(): Promise<{ users: UserRow[]; currentUserId: string }> {
  const me = await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active")
    .order("full_name");
  if (error) throw new Error(error.message);

  // Sign-in times come from Auth (admin API, server-only, after the CEO check above)
  const admin = createSupabaseAdminClient();
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 200 });
  const byId = new Map((authUsers?.users ?? []).map((u) => [u.id, u]));

  return {
    currentUserId: me.id,
    users: profiles.map((p) => {
      const u = byId.get(p.id);
      return {
        ...p,
        last_sign_in_at: u?.last_sign_in_at ?? null,
        invited_pending: Boolean(u?.invited_at && !u.last_sign_in_at),
      };
    }),
  };
}
