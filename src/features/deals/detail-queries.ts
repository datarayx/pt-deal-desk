import "server-only";

import { notFound } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

export type DealDetail = {
  deal: {
    id: string;
    reference: string;
    client_id: string;
    client_name: string;
    client_type: Enums["client_type"];
    financier_id: string | null;
    financier_name: string | null;
    facility_type: string | null;
    referrer_name: string | null;
    outcome: Enums["deal_outcome"];
    amount_requested: string | null;
    amount_approved: string | null;
    amount_disbursed: string | null;
    tenor_months: number | null;
    interest_rate_monthly: string | null;
    purpose: string | null;
    collateral_type: string | null;
    collateral_value: string | null;
    guarantor_name: string | null;
    guarantor_cheques: boolean;
    other_fees_note: string | null;
    offer_date: string | null;
    disbursement_date: string | null;
    first_repayment_date: string | null;
    maturity_date: string | null;
    repayment_frequency: Enums["repayment_frequency"] | null;
    decline_reason: string | null;
    stage_entered_at: string;
    created_at: string;
  };
  stage: DealStage;
  stages: DealStage[];
  requirements: DealRequirement[];
  history: DealStageHistory[];
  schedules: DealSchedule[];
  fees: DealFee[];
  documents: DealDocument[];
  activities: DealActivity[];
};

export type DealStage = {
  id: string;
  name: string;
  sort_order: number;
  is_terminal: boolean;
  color: string | null;
  system_key: string | null;
};

export type DealRequirement = {
  id: string;
  item: string;
  is_required: boolean;
  sort_order: number;
  status: Enums["requirement_status"];
  file_path: string | null;
};

export type DealStageHistory = {
  id: string;
  changed_at: string;
  note: string | null;
  from_stage_name: string | null;
  to_stage_name: string;
};

export type DealSchedule = {
  id: string;
  instalment_no: number;
  due_date: string;
  principal_due: string;
  interest_due: string;
  total_due: string;
  status: Enums["instalment_status"];
  days_overdue: number;
  report_count: number;
};

export type DealFee = {
  id: string;
  fee_kind: Enums["fee_kind"];
  basis: Enums["fee_basis"];
  value: string;
  base_amount: string | null;
  computed_amount: string | null;
  trigger: Enums["fee_trigger"];
  status: Enums["fee_status"];
  earned_at: string | null;
};

export type DealDocument = {
  id: string;
  title: string;
  file_path: string;
  created_at: string;
};

export type DealActivity = {
  id: string;
  kind: Enums["activity_kind"];
  body: string;
  occurred_at: string;
};

export async function getDealDetail(dealId: string): Promise<DealDetail> {
  await requireRole("ceo");
  const parsedId = z.uuid().safeParse(dealId);
  if (!parsedId.success) notFound();
  const supabase = await createSupabaseServerClient();
  const dealResult = await supabase
    .from("deals")
    .select(
      "id, reference, client_id, financier_id, facility_type_id, referrer_id, outcome, amount_requested::text, amount_approved::text, amount_disbursed::text, tenor_months, interest_rate_monthly::text, purpose, collateral_type, collateral_value::text, guarantor_name, guarantor_cheques, other_fees_note, offer_date, disbursement_date, first_repayment_date, maturity_date, repayment_frequency, decline_reason, stage_id, stage_entered_at, created_at",
    )
    .eq("id", parsedId.data)
    .maybeSingle();
  if (dealResult.error) throw new Error(dealResult.error.message);
  const row = dealResult.data;
  if (!row) notFound();

  const [
    stageResult,
    stagesResult,
    clientResult,
    financierResult,
    facilityResult,
    referrerResult,
    requirementsResult,
    historyResult,
    schedulesResult,
    feesResult,
    documentsResult,
    activitiesResult,
  ] = await Promise.all([
    supabase
      .from("deal_stages")
      .select("id, name, sort_order, is_terminal, color, system_key")
      .eq("id", row.stage_id)
      .single(),
    supabase
      .from("deal_stages")
      .select("id, name, sort_order, is_terminal, color, system_key")
      .order("sort_order"),
    supabase.from("clients").select("display_name, client_type").eq("id", row.client_id).single(),
    row.financier_id
      ? supabase.from("financiers").select("name").eq("id", row.financier_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    row.facility_type_id
      ? supabase.from("facility_types").select("name").eq("id", row.facility_type_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    row.referrer_id
      ? supabase.from("referrers").select("name").eq("id", row.referrer_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("deal_requirements")
      .select("id, item, is_required, sort_order, status, file_path")
      .eq("deal_id", row.id)
      .order("sort_order"),
    supabase
      .from("deal_stage_history")
      .select("id, from_stage_id, to_stage_id, changed_at, note")
      .eq("deal_id", row.id)
      .order("changed_at", { ascending: false }),
    supabase
      .from("repayment_schedules")
      .select(
        "id, instalment_no, due_date, principal_due::text, interest_due::text, total_due::text, status, days_overdue",
      )
      .eq("deal_id", row.id)
      .order("due_date"),
    supabase
      .from("deal_fees")
      .select(
        "id, fee_kind, basis, value::text, base_amount::text, computed_amount::text, trigger, status, earned_at",
      )
      .eq("deal_id", row.id)
      .neq("status", "cancelled")
      .order("created_at"),
    supabase
      .from("deal_documents")
      .select("id, title, file_path, created_at")
      .eq("deal_id", row.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("activities")
      .select("id, kind, body, occurred_at")
      .eq("entity_type", "deal")
      .eq("entity_id", row.id)
      .order("occurred_at", { ascending: false }),
  ]);
  for (const result of [
    stageResult,
    stagesResult,
    clientResult,
    financierResult,
    facilityResult,
    referrerResult,
    requirementsResult,
    historyResult,
    schedulesResult,
    feesResult,
    documentsResult,
    activitiesResult,
  ]) {
    if (result.error) throw new Error(result.error.message);
  }
  if (!stageResult.data || !clientResult.data) notFound();

  const stageMap = new Map((stagesResult.data ?? []).map((stage) => [stage.id, stage]));
  const scheduleIds = (schedulesResult.data ?? []).map((schedule) => schedule.id);
  const reportsResult = scheduleIds.length
    ? await supabase.from("repayment_reports").select("schedule_id").in("schedule_id", scheduleIds)
    : { data: [], error: null };
  if (reportsResult.error) throw new Error(reportsResult.error.message);
  const reportCounts = new Map<string, number>();
  for (const report of reportsResult.data ?? [])
    reportCounts.set(report.schedule_id, (reportCounts.get(report.schedule_id) ?? 0) + 1);

  return {
    deal: {
      id: row.id,
      reference: row.reference,
      client_id: row.client_id,
      client_name: clientResult.data.display_name,
      client_type: clientResult.data.client_type,
      financier_id: row.financier_id,
      financier_name: financierResult.data?.name ?? null,
      facility_type: facilityResult.data?.name ?? null,
      referrer_name: referrerResult.data?.name ?? null,
      outcome: row.outcome,
      amount_requested: row.amount_requested,
      amount_approved: row.amount_approved,
      amount_disbursed: row.amount_disbursed,
      tenor_months: row.tenor_months,
      interest_rate_monthly: row.interest_rate_monthly,
      purpose: row.purpose,
      collateral_type: row.collateral_type,
      collateral_value: row.collateral_value,
      guarantor_name: row.guarantor_name,
      guarantor_cheques: row.guarantor_cheques,
      other_fees_note: row.other_fees_note,
      offer_date: row.offer_date,
      disbursement_date: row.disbursement_date,
      first_repayment_date: row.first_repayment_date,
      maturity_date: row.maturity_date,
      repayment_frequency: row.repayment_frequency,
      decline_reason: row.decline_reason,
      stage_entered_at: row.stage_entered_at,
      created_at: row.created_at,
    },
    stage: stageResult.data,
    stages: (stagesResult.data ?? []) as DealStage[],
    requirements: (requirementsResult.data ?? []) as DealRequirement[],
    history: (historyResult.data ?? []).map((history) => ({
      id: history.id,
      changed_at: history.changed_at,
      note: history.note,
      from_stage_name: history.from_stage_id
        ? (stageMap.get(history.from_stage_id)?.name ?? null)
        : null,
      to_stage_name: stageMap.get(history.to_stage_id)?.name ?? "Unknown stage",
    })),
    schedules: (schedulesResult.data ?? []).map((schedule) => ({
      ...schedule,
      principal_due: schedule.principal_due,
      interest_due: schedule.interest_due,
      total_due: schedule.total_due,
      report_count: reportCounts.get(schedule.id) ?? 0,
    })),
    fees: (feesResult.data ?? []) as DealFee[],
    documents: (documentsResult.data ?? []) as DealDocument[],
    activities: (activitiesResult.data ?? []) as DealActivity[],
  };
}
