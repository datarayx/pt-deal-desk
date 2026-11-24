"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { callLogSchema } from "@/features/follow-ups/schemas";
import { type ActionResult, friendlyDbError, issuesToFieldErrors } from "@/lib/actions";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logFollowUpCall(taskId: unknown, input: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const id = z.uuid().safeParse(taskId);
  const parsed = callLogSchema.safeParse(input);
  if (!id.success || !parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: parsed.success ? undefined : issuesToFieldErrors(parsed.error.issues),
    };
  }
  const supabase = await createSupabaseServerClient();
  const { data: task, error: taskError } = await supabase
    .from("follow_up_tasks")
    .update({
      status: "done",
      outcome: parsed.data.outcome,
      promise_to_pay_date: parsed.data.promise_to_pay_date,
    })
    .eq("id", id.data)
    .select("id, deal_id")
    .maybeSingle();
  if (taskError) return { ok: false, error: friendlyDbError(taskError, "this call task") };
  if (!task) return { ok: false, error: "This call task no longer exists. Refresh the page." };

  const promise = parsed.data.promise_to_pay_date
    ? ` Promise to pay by ${parsed.data.promise_to_pay_date}.`
    : "";
  const { error: activityError } = await supabase.from("activities").insert({
    entity_type: "deal",
    entity_id: task.deal_id,
    kind: "call",
    body: `${parsed.data.outcome}${promise}`,
  });
  if (activityError)
    return { ok: false, error: friendlyDbError(activityError, "the call activity") };
  refresh();
  return { ok: true };
}
