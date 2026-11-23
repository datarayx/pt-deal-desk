"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { kycDocTypeSchema } from "@/features/settings/schemas";
import { type ActionResult, friendlyDbError, issuesToFieldErrors } from "@/lib/actions";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const id = z.uuid();

export async function saveKycDocType(docTypeId: unknown, input: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const parsed = kycDocTypeSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Check the form.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };

  const supabase = await createSupabaseServerClient();
  if (docTypeId === null) {
    const { data: last } = await supabase
      .from("kyc_document_types")
      .select("sort_order")
      .eq("client_type", parsed.data.client_type)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase
      .from("kyc_document_types")
      .insert({ ...parsed.data, sort_order: (last?.sort_order ?? 0) + 1 });
    if (error) return { ok: false, error: friendlyDbError(error, "this document") };
  } else {
    const key = id.safeParse(docTypeId);
    if (!key.success) return { ok: false, error: "Unknown document." };
    // client_type is fixed once created (documents already filed against it)
    const { client_type: _ignored, ...changes } = parsed.data;
    const { error } = await supabase.from("kyc_document_types").update(changes).eq("id", key.data);
    if (error) return { ok: false, error: friendlyDbError(error, "this document") };
  }
  refresh();
  return { ok: true };
}

export async function deleteKycDocType(docTypeId: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const key = id.safeParse(docTypeId);
  if (!key.success) return { ok: false, error: "Unknown document." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("kyc_document_types").delete().eq("id", key.data);
  if (error) {
    return {
      ok: false,
      error:
        error.code === "23503"
          ? "Clients already have this document on file, so it can't be removed. Mark it optional instead."
          : friendlyDbError(error, "this document"),
    };
  }
  refresh();
  return { ok: true };
}

export async function reorderKycDocTypes(orderedIds: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const ids = z.array(z.uuid()).min(1).max(100).safeParse(orderedIds);
  if (!ids.success) return { ok: false, error: "Invalid order." };

  const supabase = await createSupabaseServerClient();
  const results = await Promise.all(
    ids.data.map((docId, index) =>
      supabase
        .from("kyc_document_types")
        .update({ sort_order: index + 1 })
        .eq("id", docId),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: friendlyDbError(failed.error, "the checklist") };
  refresh();
  return { ok: true };
}
