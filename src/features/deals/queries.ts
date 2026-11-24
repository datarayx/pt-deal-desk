import "server-only";

import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dealOutcome } from "@/lib/status";

export type DealStageOption = {
  id: string;
  name: string;
  sort_order: number;
  is_terminal: boolean;
  color: string | null;
};

export type DealListRow = {
  id: string;
  reference: string;
  client_id: string;
  client_name: string;
  financier_id: string | null;
  financier_name: string;
  facility_type_id: string | null;
  facility_type: string;
  referrer_id: string | null;
  referrer_name: string | null;
  stage_id: string;
  stage_name: string;
  stage_color: string | null;
  stage_sort_order: number;
  is_terminal: boolean;
  outcome: keyof typeof dealOutcome;
  amount: string | null;
  amount_label: "requested" | "approved" | "disbursed" | null;
  stage_entered_at: string;
  days_in_stage: number;
  deficiency_count: number;
  stale: boolean;
  created_at: string;
};

export type DealFormOptions = {
  clients: { id: string; display_name: string }[];
  financiers: { id: string; name: string }[];
  facilityTypes: { id: string; name: string }[];
  referrers: { id: string; name: string }[];
};

export type DealsPageData = {
  deals: DealListRow[];
  stages: DealStageOption[];
  options: DealFormOptions;
};

function amountOf(row: {
  amount_requested: string | null;
  amount_approved: string | null;
  amount_disbursed: string | null;
}): Pick<DealListRow, "amount" | "amount_label"> {
  if (row.amount_disbursed !== null)
    return { amount: row.amount_disbursed, amount_label: "disbursed" };
  if (row.amount_approved !== null)
    return { amount: row.amount_approved, amount_label: "approved" };
  if (row.amount_requested !== null)
    return { amount: row.amount_requested, amount_label: "requested" };
  return { amount: null, amount_label: null };
}

function daysSince(value: string): number {
  const elapsed = Date.now() - new Date(value).getTime();
  return Math.max(0, Math.floor(elapsed / 86_400_000));
}

export async function getDealsPageData(): Promise<DealsPageData> {
  await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const [
    dealsResult,
    stagesResult,
    clientsResult,
    financiersResult,
    facilitiesResult,
    referrersResult,
  ] = await Promise.all([
    supabase
      .from("deals")
      .select(
        "id, reference, client_id, financier_id, facility_type_id, referrer_id, stage_id, outcome, amount_requested::text, amount_approved::text, amount_disbursed::text, stage_entered_at, created_at, clients(display_name), financiers(name), facility_types(name), referrers(name), deal_stages!deals_stage_id_fkey(name, color, sort_order, is_terminal)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("deal_stages")
      .select("id, name, sort_order, is_terminal, color")
      .order("sort_order"),
    supabase.from("clients").select("id, display_name").order("display_name"),
    supabase.from("financiers").select("id, name").order("name"),
    supabase.from("facility_types").select("id, name").order("name"),
    supabase.from("referrers").select("id, name").order("name"),
  ]);
  for (const result of [
    dealsResult,
    stagesResult,
    clientsResult,
    financiersResult,
    facilitiesResult,
    referrersResult,
  ]) {
    if (result.error) throw new Error(result.error.message);
  }

  const dealsData = dealsResult.data ?? [];
  const dealIds = dealsData.map((deal) => deal.id);
  const requirementsResult = dealIds.length
    ? await supabase
        .from("deal_requirements")
        .select("deal_id, is_required, status")
        .in("deal_id", dealIds)
    : { data: [], error: null };
  if (requirementsResult.error) throw new Error(requirementsResult.error.message);

  const deficiencies = new Map<string, number>();
  for (const requirement of requirementsResult.data ?? []) {
    if (requirement.is_required && requirement.status === "pending") {
      deficiencies.set(requirement.deal_id, (deficiencies.get(requirement.deal_id) ?? 0) + 1);
    }
  }

  const stages = (stagesResult.data ?? []) as DealStageOption[];
  const deals: DealListRow[] = dealsData.map((deal) => {
    const stage = deal.deal_stages;
    const days = daysSince(deal.stage_entered_at);
    return {
      id: deal.id,
      reference: deal.reference,
      client_id: deal.client_id,
      client_name: deal.clients?.display_name ?? "Unknown client",
      financier_id: deal.financier_id,
      financier_name: deal.financiers?.name ?? "Unassigned",
      facility_type_id: deal.facility_type_id,
      facility_type: deal.facility_types?.name ?? "Unspecified facility",
      referrer_id: deal.referrer_id,
      referrer_name: deal.referrers?.name ?? null,
      stage_id: deal.stage_id,
      stage_name: stage?.name ?? "Unknown stage",
      stage_color: stage?.color ?? null,
      stage_sort_order: stage?.sort_order ?? 0,
      is_terminal: stage?.is_terminal ?? false,
      outcome: deal.outcome,
      ...amountOf(deal),
      stage_entered_at: deal.stage_entered_at,
      days_in_stage: days,
      deficiency_count: deficiencies.get(deal.id) ?? 0,
      stale: days > 30 && !(stage?.is_terminal ?? false),
      created_at: deal.created_at,
    };
  });

  return {
    deals,
    stages,
    options: {
      clients: clientsResult.data ?? [],
      financiers: financiersResult.data ?? [],
      facilityTypes: facilitiesResult.data ?? [],
      referrers: referrersResult.data ?? [],
    },
  };
}
