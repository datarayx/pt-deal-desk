"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { confirmRepaymentSchema, repaymentReportSchema } from "@/features/repayments/schemas";
import { type ActionResult, friendlyDbError, issuesToFieldErrors } from "@/lib/actions";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

const idSchema = z.uuid();
const PROOF_PATH = /^[A-Za-z0-9-]{36}\/[A-Za-z0-9-]{36}\.(pdf|jpg|png|webp)$/;

export async function getRepaymentProofSignedFileUrl(
  reportId: unknown,
): Promise<ActionResult<{ url: string }>> {
  const user = await requireRole("ceo");
  const parsed = idSchema.safeParse(reportId);
  if (!parsed.success) return { ok: false, error: "That proof file is not valid." };
  const supabase = await createSupabaseServerClient();
  const { data: report, error } = await supabase
    .from("repayment_reports")
    .select("id, schedule_id, proof_file_path")
    .eq("id", parsed.data)
    .maybeSingle();
  if (error) return { ok: false, error: friendlyDbError(error, "this proof file") };
  if (!report?.proof_file_path)
    return { ok: false, error: "No proof file is attached to this payment." };
  const { data: schedule, error: scheduleError } = await supabase
    .from("repayment_schedules")
    .select("deal_id")
    .eq("id", report.schedule_id)
    .maybeSingle();
  if (scheduleError || !schedule)
    return { ok: false, error: "That payment is no longer attached to a deal." };
  if (
    !PROOF_PATH.test(report.proof_file_path) ||
    !report.proof_file_path.startsWith(`${schedule.deal_id}/`)
  )
    return { ok: false, error: "That proof file is not valid for this deal." };
  const signed = await supabase.storage
    .from("repayment-proofs")
    .createSignedUrl(report.proof_file_path, 300);
  if (signed.error || !signed.data?.signedUrl)
    return { ok: false, error: "The proof file could not be opened." };
  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "signed_url",
    entity_type: "repayment_report",
    entity_id: report.id,
    after: {
      bucket: "repayment-proofs",
      path: report.proof_file_path,
      deal_id: schedule.deal_id,
    },
  });
  return { ok: true, data: { url: signed.data.signedUrl } };
}

export async function reportRepayment(
  input: unknown,
): Promise<ActionResult<{ reportIds: string[] }>> {
  await requireRole("ceo");
  const parsed = repaymentReportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  }
  if (
    !PROOF_PATH.test(parsed.data.proof_file_path) ||
    !parsed.data.proof_file_path.startsWith(`${parsed.data.deal_id}/`)
  ) {
    return { ok: false, error: "That proof file is not valid for this deal." };
  }
  const supabase = await createSupabaseServerClient();
  const args = {
    p_deal_id: parsed.data.deal_id,
    p_amount: parsed.data.amount,
    p_paid_on: parsed.data.paid_on,
    p_channel: parsed.data.channel,
    p_proof_file_path: parsed.data.proof_file_path,
  } as unknown as Database["public"]["Functions"]["report_repayment"]["Args"];
  const { data, error } = await supabase.rpc("report_repayment", args);
  if (error) return { ok: false, error: friendlyDbError(error, "this repayment") };
  refresh();
  return { ok: true, data: { reportIds: data ?? [] } };
}

export async function confirmRepayment(reportId: unknown, input: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const id = idSchema.safeParse(reportId);
  const parsed = confirmRepaymentSchema.safeParse(input);
  if (!id.success || !parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: parsed.success ? undefined : issuesToFieldErrors(parsed.error.issues),
    };
  }
  const supabase = await createSupabaseServerClient();
  const args = {
    p_report_id: id.data,
    p_confirmed_at: `${parsed.data.confirmed_at}T12:00:00+01:00`,
    p_note: parsed.data.confirmation_note ?? undefined,
  } as Database["public"]["Functions"]["confirm_repayment_report"]["Args"];
  const { error } = await supabase.rpc("confirm_repayment_report", args);
  if (error) return { ok: false, error: friendlyDbError(error, "this repayment") };
  refresh();
  return { ok: true };
}

