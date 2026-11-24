"use server";

import { refresh } from "next/cache";

import { friendlyDbError, type ActionResult } from "@/lib/actions";
import { requireRole, requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function markAlertRead(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("alerts")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) return { ok: false, error: friendlyDbError(error, "this alert") };
  refresh();
  return { ok: true };
}

export async function markAllAlertsRead(): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("alerts")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  query =
    user.role === "ceo"
      ? query.or(`user_id.eq.${user.id},user_id.is.null`)
      : query.eq("user_id", user.id);
  const { error } = await query;
  if (error) return { ok: false, error: friendlyDbError(error, "your alerts") };
  refresh();
  return { ok: true };
}

export async function runRemindersNow(): Promise<
  ActionResult<{ alerts: number; outbox_emails: number; follow_up_tasks: number }>
> {
  await requireRole("ceo");
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return { ok: false, error: "The manual reminder run is available in demo mode only." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("run_daily_reminders", {});
  if (error) return { ok: false, error: friendlyDbError(error, "the reminders") };

  const result = (data ?? {}) as {
    alerts?: number;
    outbox_emails?: number;
    follow_up_tasks?: number;
  };
  refresh();
  return {
    ok: true,
    data: {
      alerts: result.alerts ?? 0,
      outbox_emails: result.outbox_emails ?? 0,
      follow_up_tasks: result.follow_up_tasks ?? 0,
    },
  };
}
