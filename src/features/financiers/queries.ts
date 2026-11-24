import "server-only";

import { notFound } from "next/navigation";
import { z } from "zod";

import type { FinancierType } from "@/features/financiers/schemas";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type DealOutcome = Database["public"]["Enums"]["deal_outcome"];

export type FinancierListRow = {
  id: string;
  name: string;
  financier_type: FinancierType;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  rate_min_monthly: string | null;
  rate_max_monthly: string | null;
  facility_types: string[];
  deal_count: number;
  pipeline_count: number;
  funded_count: number;
  total_disbursed: string;
  requirement_count: number;
};

const rate = (v: number | null) => (v === null ? null : String(v));

export async function getFinanciers(): Promise<FinancierListRow[]> {
  await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const [financiers, stats] = await Promise.all([
    supabase
      .from("financiers")
      .select(
        "id, name, financier_type, contact_person, phone, email, rate_min_monthly, rate_max_monthly, facility_types",
      )
      .order("name"),
    supabase.from("v_financier_stats").select("*"),
  ]);
  if (financiers.error) throw new Error(financiers.error.message);
  if (stats.error) throw new Error(stats.error.message);
  const byId = new Map(stats.data.map((s) => [s.financier_id, s]));
  return financiers.data.map((f) => {
    const s = byId.get(f.id);
    return {
      ...f,
      rate_min_monthly: rate(f.rate_min_monthly),
      rate_max_monthly: rate(f.rate_max_monthly),
      deal_count: s?.deal_count ?? 0,
      pipeline_count: s?.pipeline_count ?? 0,
      funded_count: s?.funded_count ?? 0,
      total_disbursed: s?.total_disbursed ?? "0",
      requirement_count: s?.requirement_count ?? 0,
    };
  });
}

export type FinancierDetail = FinancierListRow & {
  collateral_policy: string | null;
  notes: string | null;
  created_at: string;
};

export type RequirementRow = { id: string; item: string; is_required: boolean; sort_order: number };

export type FinancierDealRow = {
  id: string;
  reference: string;
  client_id: string;
  client_name: string;
  facility_type: string | null;
  stage_name: string;
  stage_color: string | null;
  outcome: DealOutcome;
  amount: string | null;
  amount_label: "requested" | "approved" | "disbursed" | null;
  disbursement_date: string | null;
  created_at: string;
};

/** Best amount to show for a deal: disbursed, else approved, else requested. */
export function dealAmount(d: {
  amount_requested: string | null;
  amount_approved: string | null;
  amount_disbursed: string | null;
}): Pick<FinancierDealRow, "amount" | "amount_label"> {
  if (d.amount_disbursed !== null) return { amount: d.amount_disbursed, amount_label: "disbursed" };
  if (d.amount_approved !== null) return { amount: d.amount_approved, amount_label: "approved" };
  if (d.amount_requested !== null) return { amount: d.amount_requested, amount_label: "requested" };
  return { amount: null, amount_label: null };
}

export async function getFinancier(financierId: string) {
  await requireRole("ceo");
  const id = z.uuid().safeParse(financierId);
  if (!id.success) notFound();
  const supabase = await createSupabaseServerClient();
  const [financier, stats, requirements, deals] = await Promise.all([
    supabase.from("financiers").select("*").eq("id", id.data).maybeSingle(),
    supabase.from("v_financier_stats").select("*").eq("financier_id", id.data).maybeSingle(),
    supabase
      .from("financier_requirements")
      .select("id, item, is_required, sort_order")
      .eq("financier_id", id.data)
      .order("sort_order"),
    supabase
      .from("deals")
      .select(
        "id, reference, client_id, outcome, amount_requested::text, amount_approved::text, amount_disbursed::text, disbursement_date, created_at, clients(display_name), facility_types(name), deal_stages!deals_stage_id_fkey(name, color)",
      )
      .eq("financier_id", id.data)
      .order("created_at", { ascending: false }),
  ]);
  for (const r of [financier, stats, requirements, deals])
    if (r.error) throw new Error(r.error.message);
  const f = financier.data;
  if (!f) notFound();
  const s = stats.data;

  const detail: FinancierDetail = {
    id: f.id,
    name: f.name,
    financier_type: f.financier_type,
    contact_person: f.contact_person,
    phone: f.phone,
    email: f.email,
    rate_min_monthly: rate(f.rate_min_monthly),
    rate_max_monthly: rate(f.rate_max_monthly),
    facility_types: f.facility_types,
    collateral_policy: f.collateral_policy,
    notes: f.notes,
    created_at: f.created_at,
    deal_count: s?.deal_count ?? 0,
    pipeline_count: s?.pipeline_count ?? 0,
    funded_count: s?.funded_count ?? 0,
    total_disbursed: s?.total_disbursed ?? "0",
    requirement_count: s?.requirement_count ?? 0,
  };

  const dealRows: FinancierDealRow[] = (deals.data ?? []).map((d) => ({
    id: d.id,
    reference: d.reference,
    client_id: d.client_id,
    client_name: d.clients?.display_name ?? "—",
    facility_type: d.facility_types?.name ?? null,
    stage_name: d.deal_stages?.name ?? "—",
    stage_color: d.deal_stages?.color ?? null,
    outcome: d.outcome,
    disbursement_date: d.disbursement_date,
    created_at: d.created_at,
    ...dealAmount(d),
  }));

  return {
    financier: detail,
    requirements: (requirements.data ?? []) as RequirementRow[],
    deals: dealRows,
  };
}

/** Facility type names from Settings, for the financier form. */
export async function getFacilityTypeNames(): Promise<string[]> {
  await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("facility_types").select("name").order("name");
  if (error) throw new Error(error.message);
  return data.map((r) => r.name);
}
