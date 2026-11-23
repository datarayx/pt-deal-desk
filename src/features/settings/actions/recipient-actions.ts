"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { recipientSchema } from "@/features/settings/schemas";
import { type ActionResult, friendlyDbError, issuesToFieldErrors } from "@/lib/actions";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const id = z.uuid();

export async function saveRecipient(recipientId: unknown, input: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const parsed = recipientSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Check the form.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };

  const supabase = await createSupabaseServerClient();
  const key = recipientId === null ? null : id.safeParse(recipientId);
  if (key && !key.success) return { ok: false, error: "Unknown recipient." };

  const { error } = key
    ? await supabase.from("notification_recipients").update(parsed.data).eq("id", key.data)
    : await supabase.from("notification_recipients").insert(parsed.data);
  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "That email address is already a recipient."
          : friendlyDbError(error, "this recipient"),
    };
  }
  refresh();
  return { ok: true };
}

export async function setRecipientActive(
  recipientId: unknown,
  active: unknown,
): Promise<ActionResult> {
  await requireRole("ceo");
  const key = id.safeParse(recipientId);
  const flag = z.boolean().safeParse(active);
  if (!key.success || !flag.success) return { ok: false, error: "Invalid request." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notification_recipients")
    .update({ is_active: flag.data })
    .eq("id", key.data);
  if (error) return { ok: false, error: friendlyDbError(error, "this recipient") };
  refresh();
  return { ok: true };
}

export async function deleteRecipient(recipientId: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const key = id.safeParse(recipientId);
  if (!key.success) return { ok: false, error: "Unknown recipient." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notification_recipients").delete().eq("id", key.data);
  if (error) return { ok: false, error: friendlyDbError(error, "this recipient") };
  refresh();
  return { ok: true };
}
