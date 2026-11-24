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
