"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { financierSchema, requirementSchema } from "@/features/financiers/schemas";
import { type ActionResult, friendlyDbError, issuesToFieldErrors } from "@/lib/actions";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const id = z.uuid();

/** Create (id null) or update a financier. Returns the financier id. */
export async function saveFinancier(
  financierId: unknown,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("ceo");
  const key = financierId === null ? null : id.safeParse(financierId);
  if (key && !key.success) return { ok: false, error: "Unknown financier." };
  const parsed = financierSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  }
  const values = {
    ...parsed.data,
    rate_min_monthly:
      parsed.data.rate_min_monthly === null ? null : Number(parsed.data.rate_min_monthly),
    rate_max_monthly:
      parsed.data.rate_max_monthly === null ? null : Number(parsed.data.rate_max_monthly),
    facility_types: [...new Set(parsed.data.facility_types)],
  };
  const supabase = await createSupabaseServerClient();
  const query = key
    ? supabase.from("financiers").update(values).eq("id", key.data)
    : supabase.from("financiers").insert(values);
  const { data, error } = await query.select("id").single();
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "A financier with this name already exists.",
        fieldErrors: { name: "A financier with this name already exists." },
      };
    }
    return { ok: false, error: friendlyDbError(error, "this financier") };
  }
  refresh();
  return { ok: true, data: { id: data.id } };
}

export async function deleteFinancier(financierId: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const key = id.safeParse(financierId);
  if (!key.success) return { ok: false, error: "Unknown financier." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("financiers").delete().eq("id", key.data);
  if (error) {
    if (error.code === "23503") {
      return { ok: false, error: "This financier has deals, so it can't be deleted." };
    }
    return { ok: false, error: friendlyDbError(error, "this financier") };
  }
  return { ok: true };
}

// --- Requirement checklist template ---------------------------------------------------------

export async function saveRequirement(
  financierId: unknown,
  requirementId: unknown,
  input: unknown,
): Promise<ActionResult> {
  await requireRole("ceo");
  const fin = id.safeParse(financierId);
  const req = requirementId === null ? null : id.safeParse(requirementId);
  if (!fin.success || (req && !req.success)) return { ok: false, error: "Unknown requirement." };
  const parsed = requirementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  }
  const supabase = await createSupabaseServerClient();
  let error;
  if (req) {
    ({ error } = await supabase
      .from("financier_requirements")
      .update(parsed.data)
      .eq("id", req.data)
      .eq("financier_id", fin.data));
  } else {
    const { data: last } = await supabase
      .from("financier_requirements")
      .select("sort_order")
      .eq("financier_id", fin.data)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    ({ error } = await supabase
      .from("financier_requirements")
      .insert({ ...parsed.data, financier_id: fin.data, sort_order: (last?.sort_order ?? 0) + 1 }));
  }
  if (error) {
    if (error.code === "23505") {
      const message = "This requirement is already on the checklist.";
      return { ok: false, error: message, fieldErrors: { item: message } };
    }
    return { ok: false, error: friendlyDbError(error, "this requirement") };
  }
  refresh();
  return { ok: true };
}

export async function deleteRequirement(requirementId: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const key = id.safeParse(requirementId);
  if (!key.success) return { ok: false, error: "Unknown requirement." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("financier_requirements").delete().eq("id", key.data);
  if (error) return { ok: false, error: friendlyDbError(error, "this requirement") };
  refresh();
  return { ok: true };
}

/** Save a new order (1..n). Only rows of this financier are touched. */
export async function reorderRequirements(
  financierId: unknown,
  orderedIds: unknown,
): Promise<ActionResult> {
  await requireRole("ceo");
  const fin = id.safeParse(financierId);
  const ids = z.array(id).min(1).max(200).safeParse(orderedIds);
  if (!fin.success || !ids.success) return { ok: false, error: "Couldn't read the new order." };
  const supabase = await createSupabaseServerClient();
  const results = await Promise.all(
    ids.data.map((reqId, index) =>
      supabase
        .from("financier_requirements")
        .update({ sort_order: index + 1 })
        .eq("id", reqId)
        .eq("financier_id", fin.data),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: friendlyDbError(failed.error, "the checklist") };
  refresh();
  return { ok: true };
}
