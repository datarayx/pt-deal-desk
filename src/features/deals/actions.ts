"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { dealOutcomeSchema, disburseDealSchema, newDealSchema } from "@/features/deals/schemas";
import { type ActionResult, friendlyDbError, issuesToFieldErrors } from "@/lib/actions";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, TablesInsert } from "@/types/database";

const idSchema = z.uuid();

export async function createDeal(
  input: unknown,
): Promise<ActionResult<{ id: string; reference: string }>> {
  const user = await requireRole("ceo");
  const parsed = newDealSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createSupabaseServerClient();
  const year = new Intl.DateTimeFormat("en", { timeZone: "Africa/Lagos", year: "numeric" }).format(
    new Date(),
  );
  const [latest, firstStage, requirements] = await Promise.all([
    supabase
      .from("deals")
      .select("reference")
      .like("reference", `PT-${year}-%`)
      .order("reference", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("deal_stages").select("id").order("sort_order").limit(1).maybeSingle(),
    supabase
      .from("financier_requirements")
      .select("item, is_required, sort_order")
      .eq("financier_id", parsed.data.financier_id)
      .order("sort_order"),
  ]);
  for (const result of [latest, firstStage, requirements]) {
    if (result.error) return { ok: false, error: friendlyDbError(result.error, "this deal") };
  }
  if (!firstStage.data) return { ok: false, error: "Set up at least one deal stage first." };

  const lastNumber = latest.data?.reference.match(/-(\d+)$/)?.[1];
  const reference = `PT-${year}-${String(lastNumber ? Number(lastNumber) + 1 : 1).padStart(4, "0")}`;
  const v = parsed.data;
  const dealValues = {
    client_id: v.client_id,
    financier_id: v.financier_id,
    facility_type_id: v.facility_type_id,
    referrer_id: v.referrer_id,
    reference,
    stage_id: firstStage.data.id,
    amount_requested: v.amount_requested,
    amount_approved: v.amount_approved,
    tenor_months: v.tenor_months,
    interest_rate_monthly: v.interest_rate_monthly,
    purpose: v.purpose,
    collateral_type: v.collateral_type,
    collateral_value: v.collateral_value,
    guarantor_name: v.guarantor_name,
    guarantor_cheques: v.guarantor_cheques === "yes",
    other_fees_note: v.other_fees_note,
    owner_id: user.id,
  } as unknown as TablesInsert<"deals">;

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .insert(dealValues)
    .select("id, reference")
    .single();
  if (dealError || !deal) {
    if (dealError?.code === "23505") {
      return { ok: false, error: "That deal reference already exists. Try again." };
    }
    return { ok: false, error: friendlyDbError(dealError, "this deal") };
  }

  const requirementRows = (requirements.data ?? []).map((requirement) => ({
    deal_id: deal.id,
    item: requirement.item,
    is_required: requirement.is_required,
    sort_order: requirement.sort_order,
    status: requirement.is_required ? "pending" : "waived",
  })) as unknown as TablesInsert<"deal_requirements">[];
  if (requirementRows.length > 0) {
    const { error } = await supabase.from("deal_requirements").insert(requirementRows);
    if (error) {
      await supabase.from("deals").delete().eq("id", deal.id);
      return { ok: false, error: friendlyDbError(error, "this deal") };
    }
  }

  if (v.referrer_id && v.referral_fee_basis !== "none" && v.referral_fee_value) {
    const fee = {
      deal_id: deal.id,
      fee_kind: "referral_fee",
      basis: v.referral_fee_basis,
      value: v.referral_fee_value,
      trigger: "on_disbursement",
      status: "pending",
    } as unknown as TablesInsert<"deal_fees">;
    const { error } = await supabase.from("deal_fees").insert(fee);
    if (error) {
      await supabase.from("deals").delete().eq("id", deal.id);
      return { ok: false, error: friendlyDbError(error, "this referral fee") };
    }
  }

  await supabase.from("activities").insert({
    entity_type: "deal",
    entity_id: deal.id,
    kind: "system",
    body: `Deal ${deal.reference} opened`,
  });
  refresh();
  return { ok: true, data: deal };
}

export async function moveDealStage(
  dealId: unknown,
  stageName: unknown,
  note?: unknown,
): Promise<ActionResult> {
  await requireRole("ceo");
  const deal = idSchema.safeParse(dealId);
  const stage = z.string().trim().min(1).max(100).safeParse(stageName);
  const moveNote = z
    .string()
    .trim()
    .max(1000)
    .safeParse(note ?? "");
  if (!deal.success || !stage.success || !moveNote.success)
    return { ok: false, error: "Couldn't move this deal." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("move_deal_stage", {
    p_deal_id: deal.data,
    p_stage_name: stage.data,
    p_note: moveNote.data || undefined,
  });
  if (error) return { ok: false, error: friendlyDbError(error, "this deal") };
  refresh();
  return { ok: true };
}

export async function updateDealOutcome(
  dealId: unknown,
  outcome: unknown,
  input: unknown,
): Promise<ActionResult> {
  await requireRole("ceo");
  const deal = idSchema.safeParse(dealId);
  const result = z
    .enum(["declined_by_lender", "declined_by_client", "negotiating"])
    .safeParse(outcome);
  const parsed = dealOutcomeSchema.safeParse(input);
  if (!deal.success || !result.success || !parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: parsed.success ? undefined : issuesToFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("deals")
    .update({ outcome: result.data, decline_reason: parsed.data.reason })
    .eq("id", deal.data)
    .in("outcome", ["open", "negotiating"])
    .is("disbursement_date", null)
    .select("id, reference")
    .maybeSingle();
  if (error) return { ok: false, error: friendlyDbError(error, "this deal") };
  if (!data) return { ok: false, error: "Only an open, undistributed deal can change outcome." };

  const label =
    result.data === "negotiating"
      ? "Marked as negotiating"
      : result.data === "declined_by_lender"
        ? "Declined by lender"
        : "Declined by client";
  const { error: activityError } = await supabase.from("activities").insert({
    entity_type: "deal",
    entity_id: data.id,
    kind: "system",
    body: `${label}: ${parsed.data.reason}`,
  });
  if (activityError)
    return { ok: false, error: friendlyDbError(activityError, "the deal activity") };
  refresh();
  return { ok: true };
}

export async function disburseDeal(
  dealId: unknown,
  input: unknown,
): Promise<ActionResult<{ instalments: number }>> {
  await requireRole("ceo");
  const deal = idSchema.safeParse(dealId);
  const parsed = disburseDealSchema.safeParse(input);
  if (!deal.success || !parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: parsed.success ? undefined : issuesToFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createSupabaseServerClient();
  const rpcArgs = {
    p_deal_id: deal.data,
    p_amount: parsed.data.amount,
    p_disbursed_on: parsed.data.disbursed_on,
    p_first_repayment_date: parsed.data.first_repayment_date,
    p_frequency: parsed.data.frequency,
  } as unknown as Database["public"]["Functions"]["disburse_deal"]["Args"];
  const { data, error } = await supabase.rpc("disburse_deal", rpcArgs);
  if (error) return { ok: false, error: friendlyDbError(error, "this disbursement") };
  refresh();
  return { ok: true, data: { instalments: data ?? 0 } };
}
