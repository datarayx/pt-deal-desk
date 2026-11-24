"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { callLogSchema } from "@/features/follow-ups/schemas";
import { type ActionResult, friendlyDbError, issuesToFieldErrors } from "@/lib/actions";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logDashboardCall(
  scheduleId: unknown,
  dealId: unknown,
  input: unknown,
): Promise<ActionResult> {
  await requireRole("ceo");
  const schedule = z.uuid().safeParse(scheduleId);
  const deal = z.uuid().safeParse(dealId);
  const parsed = callLogSchema.safeParse(input);
  if (!schedule.success || !deal.success || !parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: parsed.success ? undefined : issuesToFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createSupabaseServerClient();
  let taskId: string | null = null;
  const existing = await supabase
    .from("follow_up_tasks")
    .select("id")
    .eq("schedule_id", schedule.data)
    .eq("status", "open")
    .maybeSingle();
  if (existing.error)
    return { ok: false, error: friendlyDbError(existing.error, "this call task") };
  taskId = existing.data?.id ?? null;
  if (!taskId) {
    const created = await supabase
      .from("follow_up_tasks")
      .insert({
        deal_id: deal.data,
        schedule_id: schedule.data,
        due_date: new Date().toISOString().slice(0, 10),
      })
      .select("id")
      .single();
    if (created.error) return { ok: false, error: friendlyDbError(created.error, "the call task") };
    taskId = created.data.id;
  }

  const updated = await supabase
    .from("follow_up_tasks")
    .update({
      status: "done",
      outcome: parsed.data.outcome,
      promise_to_pay_date: parsed.data.promise_to_pay_date,
    })
    .eq("id", taskId);
  if (updated.error) return { ok: false, error: friendlyDbError(updated.error, "this call task") };
  const promise = parsed.data.promise_to_pay_date
    ? ` Promise to pay by ${parsed.data.promise_to_pay_date}.`
    : "";
  const activity = await supabase.from("activities").insert({
    entity_type: "deal",
    entity_id: deal.data,
    kind: "call",
    body: `${parsed.data.outcome}${promise}`,
  });
  if (activity.error)
    return { ok: false, error: friendlyDbError(activity.error, "the call activity") };
  refresh();
  return { ok: true };
}
