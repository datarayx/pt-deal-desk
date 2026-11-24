"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { referrerSchema } from "@/features/referrers/schemas";
import { type ActionResult, friendlyDbError, issuesToFieldErrors } from "@/lib/actions";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const id = z.uuid();

/** Create (id null) or update a referrer. Returns the referrer id. */
export async function saveReferrer(
  referrerId: unknown,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("ceo");
  const key = referrerId === null ? null : id.safeParse(referrerId);
  if (key && !key.success) return { ok: false, error: "Unknown referrer." };
  const parsed = referrerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  }
  const values = {
    ...parsed.data,
    // Validated to ≤ 14 significant digits, so the JSON number round-trips exactly.
    default_fee_value:
      parsed.data.default_fee_value === null ? null : Number(parsed.data.default_fee_value),
  };
  const supabase = await createSupabaseServerClient();
  const query = key
    ? supabase.from("referrers").update(values).eq("id", key.data)
    : supabase.from("referrers").insert(values);
  const { data, error } = await query.select("id").single();
  if (error) return { ok: false, error: friendlyDbError(error, "this referrer") };
  refresh();
  return { ok: true, data: { id: data.id } };
}

export async function deleteReferrer(referrerId: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const key = id.safeParse(referrerId);
  if (!key.success) return { ok: false, error: "Unknown referrer." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("referrers").delete().eq("id", key.data);
  if (error) {
    if (error.code === "23503") {
      return { ok: false, error: "This referrer has clients or deals, so it can't be deleted." };
    }
    return { ok: false, error: friendlyDbError(error, "this referrer") };
  }
  return { ok: true };
}
