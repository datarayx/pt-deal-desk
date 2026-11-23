"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { stageSchema } from "@/features/settings/schemas";
import { type ActionResult, friendlyDbError, issuesToFieldErrors } from "@/lib/actions";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const id = z.uuid();

export async function createStage(input: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const parsed = stageSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Check the form.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };

  const supabase = await createSupabaseServerClient();
  const { data: last } = await supabase
    .from("deal_stages")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase
    .from("deal_stages")
    .insert({ ...parsed.data, sort_order: (last?.sort_order ?? 0) + 1 });
  if (error) return { ok: false, error: friendlyDbError(error, "this stage") };
  refresh();
  return { ok: true };
}

export async function updateStage(stageId: unknown, input: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const key = id.safeParse(stageId);
  const parsed = stageSchema.safeParse(input);
  if (!key.success) return { ok: false, error: "Unknown stage." };
  if (!parsed.success)
    return {
      ok: false,
      error: "Check the form.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("deal_stages").update(parsed.data).eq("id", key.data);
  if (error) return { ok: false, error: friendlyDbError(error, "this stage") };
  refresh();
  return { ok: true };
}

export async function deleteStage(stageId: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const key = id.safeParse(stageId);
  if (!key.success) return { ok: false, error: "Unknown stage." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("deal_stages").delete().eq("id", key.data);
  if (error) return { ok: false, error: friendlyDbError(error, "this stage") };

  // Close the gap so stages stay numbered 1..n
  const { data: remaining } = await supabase.from("deal_stages").select("id").order("sort_order");
  await Promise.all(
    (remaining ?? []).map((stage, index) =>
      supabase
        .from("deal_stages")
        .update({ sort_order: index + 1 })
        .eq("id", stage.id),
    ),
  );
  refresh();
  return { ok: true };
}

/** Saves a new order: sort_order 1..n in the given sequence. */
export async function reorderStages(orderedIds: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const ids = z.array(z.uuid()).min(1).max(100).safeParse(orderedIds);
  if (!ids.success) return { ok: false, error: "Invalid order." };

  const supabase = await createSupabaseServerClient();
  const results = await Promise.all(
    ids.data.map((stageId, index) =>
      supabase
        .from("deal_stages")
        .update({ sort_order: index + 1 })
        .eq("id", stageId),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: friendlyDbError(failed.error, "the stages") };
  refresh();
  return { ok: true };
}
