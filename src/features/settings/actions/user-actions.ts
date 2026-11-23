"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { z } from "zod";

import { inviteUserSchema, updateUserSchema } from "@/features/settings/schemas";
import { type ActionResult, friendlyDbError, issuesToFieldErrors } from "@/lib/actions";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const id = z.uuid();

async function siteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"}`;
}

/**
 * Invites a user by email (Supabase sends the invite; DECISIONS.md allows real auth emails).
 * The role goes into app_metadata (server-only) and the profile is activated, so the new user
 * lands with the right access after choosing a password.
 */
export async function inviteUser(input: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const parsed = inviteUserSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Check the form.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { full_name: parsed.data.full_name },
    redirectTo: `${await siteUrl()}/auth/callback?next=/update-password`,
  });
  if (error || !data.user) {
    const message = /already been registered|already exists/i.test(error?.message ?? "")
      ? "Someone with that email already has an account."
      : error?.status === 429
        ? "Too many invites sent recently. Try again in a few minutes."
        : "The invite couldn't be sent. Check the email address and try again.";
    return { ok: false, error: message };
  }

  const { error: metaError } = await admin.auth.admin.updateUserById(data.user.id, {
    app_metadata: { role: parsed.data.role },
  });
  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: parsed.data.full_name, role: parsed.data.role, is_active: true })
    .eq("id", data.user.id);
  if (metaError || profileError) {
    return {
      ok: false,
      error: "The invite was sent, but the role couldn't be saved. Edit the user to set it.",
    };
  }
  refresh();
  return { ok: true };
}

/** Name, role and active status. The database stops anyone changing their own role or status. */
export async function updateUser(userId: unknown, input: unknown): Promise<ActionResult> {
  const me = await requireRole("ceo");
  const key = id.safeParse(userId);
  const parsed = updateUserSchema.safeParse(input);
  if (!key.success) return { ok: false, error: "Unknown user." };
  if (!parsed.success)
    return {
      ok: false,
      error: "Check the form.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };

  const supabase = await createSupabaseServerClient();
  const changes = key.data === me.id ? { full_name: parsed.data.full_name } : parsed.data; // own role/status locked
  const { error } = await supabase.from("profiles").update(changes).eq("id", key.data);
  if (error) return { ok: false, error: friendlyDbError(error, "this user") };

  if (key.data !== me.id) {
    // Keep the role in app_metadata in step with the profile (used for new sessions)
    const admin = createSupabaseAdminClient();
    await admin.auth.admin.updateUserById(key.data, { app_metadata: { role: parsed.data.role } });
    if (!parsed.data.is_active) await supabase.rpc("sign_out_everywhere", { p_user_id: key.data });
  }
  refresh();
  return { ok: true };
}

export async function signOutUserEverywhere(
  userId: unknown,
): Promise<ActionResult<{ sessions: number }>> {
  await requireRole("ceo");
  const key = id.safeParse(userId);
  if (!key.success) return { ok: false, error: "Unknown user." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("sign_out_everywhere", { p_user_id: key.data });
  if (error) return { ok: false, error: friendlyDbError(error, "this user") };
  refresh();
  return { ok: true, data: { sessions: data ?? 0 } };
}
