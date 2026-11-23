"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { facilityTypeSchema } from "@/features/settings/schemas";
import { type ActionResult, friendlyDbError, issuesToFieldErrors } from "@/lib/actions";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const id = z.uuid();

export async function saveFacilityType(
  facilityTypeId: unknown,
  input: unknown,
): Promise<ActionResult> {
  await requireRole("ceo");
  const parsed = facilityTypeSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Check the form.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };

  const supabase = await createSupabaseServerClient();
  const key = facilityTypeId === null ? null : id.safeParse(facilityTypeId);
  if (key && !key.success) return { ok: false, error: "Unknown facility type." };

  const { error } = key
    ? await supabase.from("facility_types").update(parsed.data).eq("id", key.data)
    : await supabase.from("facility_types").insert(parsed.data);
  if (error) return { ok: false, error: friendlyDbError(error, "this facility type") };
  refresh();
  return { ok: true };
}

export async function deleteFacilityType(facilityTypeId: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const key = id.safeParse(facilityTypeId);
  if (!key.success) return { ok: false, error: "Unknown facility type." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("facility_types").delete().eq("id", key.data);
  if (error) return { ok: false, error: friendlyDbError(error, "this facility type") };
  refresh();
  return { ok: true };
}
