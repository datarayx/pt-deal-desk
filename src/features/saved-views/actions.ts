"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { saveViewSchema } from "@/features/saved-views/schemas";
import { requireUser } from "@/lib/auth/session";
import { type ActionResult, friendlyDbError } from "@/lib/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Save (or overwrite, by name) the current table state as a named view for this user. */
export async function saveView(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireUser();
  const parsed = saveViewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the view name." };
  }
  const { tableKey, name, state } = parsed.data;
  const { hidden, ...filters } = state;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("saved_views")
    .upsert(
      { table_key: tableKey, name, filters, columns: hidden },
      { onConflict: "user_id,table_key,name" },
    )
    .select("id")
    .single();
  if (error) return { ok: false, error: friendlyDbError(error, "this view") };
  refresh();
  return { ok: true, data: { id: data.id } };
}

export async function deleteView(viewId: unknown): Promise<ActionResult> {
  await requireUser();
  const key = z.uuid().safeParse(viewId);
  if (!key.success) return { ok: false, error: "Unknown view." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("saved_views").delete().eq("id", key.data);
  if (error) return { ok: false, error: friendlyDbError(error, "this view") };
  refresh();
  return { ok: true };
}
