import "server-only";

import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

export type FollowUpRow = {
  id: string;
  deal_id: string;
  schedule_id: string | null;
  reference: string;
  client_name: string;
  due_date: string;
  assigned_to: string | null;
  assigned_name: string | null;
  status: Enums["task_status"];
  outcome: string | null;
  promise_to_pay_date: string | null;
  created_at: string;
};

export async function getFollowUps(): Promise<FollowUpRow[]> {
  await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const [tasksResult, profilesResult] = await Promise.all([
    supabase
      .from("follow_up_tasks")
      .select(
        "id, deal_id, schedule_id, due_date, assigned_to, status, outcome, promise_to_pay_date, created_at, deals(reference, clients(display_name))",
      )
      .order("status")
      .order("due_date"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);
  if (tasksResult.error) throw new Error(tasksResult.error.message);
  if (profilesResult.error) throw new Error(profilesResult.error.message);
  const profiles = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile.full_name]),
  );
  return (tasksResult.data ?? []).map((task) => ({
    id: task.id,
    deal_id: task.deal_id,
    schedule_id: task.schedule_id,
    reference: task.deals?.reference ?? "Unknown deal",
    client_name: task.deals?.clients?.display_name ?? "Unknown client",
    due_date: task.due_date,
    assigned_to: task.assigned_to,
    assigned_name: task.assigned_to ? (profiles.get(task.assigned_to) ?? null) : null,
    status: task.status,
    outcome: task.outcome,
    promise_to_pay_date: task.promise_to_pay_date,
    created_at: task.created_at,
  }));
}
