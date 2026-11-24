import "server-only";

import { requireRole, requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BellAlert = {
  id: string;
  kind: "due_soon" | "due_today" | "overdue" | "stale_deal" | "system";
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export async function getBellAlerts(): Promise<{ alerts: BellAlert[]; unreadCount: number }> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data, count, error } = await supabase
    .from("alerts")
    .select("id, kind, title, body, link, read_at, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw new Error(error.message);
  return { alerts: data, unreadCount: count ?? data.filter((alert) => !alert.read_at).length };
}

export type OutboxEmail = {
  id: string;
  to_emails: string[];
  subject: string;
  html: string;
  related_entity: string | null;
  status: "queued" | "sent" | "demo";
  created_at: string;
};

export async function getOutboxEmails(): Promise<OutboxEmail[]> {
  await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("outbox_emails")
    .select("id, to_emails, subject, html, related_entity, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
