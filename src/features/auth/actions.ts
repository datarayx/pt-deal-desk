"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  type AuthFormState,
  firstFieldErrors,
  resetRequestSchema,
  signInSchema,
  updatePasswordSchema,
} from "@/features/auth/schemas";
import { homeFor, isRole, safeNextPath } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const GENERIC_SIGN_IN_ERROR = "That email and password don't match an account.";

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  const echoedEmail = String(formData.get("email") ?? "");
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error), email: echoedEmail };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    const message =
      error?.status === 429
        ? "Too many attempts. Wait a minute and try again."
        : GENERIC_SIGN_IN_ERROR;
    return { status: "error", message, email: parsed.data.email };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile?.is_active || !isRole(profile.role)) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "Your account doesn't have access yet. Ask the CEO to activate it.",
      email: parsed.data.email,
    };
  }

  redirect(safeNextPath(parsed.data.next, profile.role));
}

async function siteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: firstFieldErrors(parsed.error),
      email: String(formData.get("email") ?? ""),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/update-password`,
  });

  if (error?.status === 429) {
    return {
      status: "error",
      message: "Too many requests. Wait a minute and try again.",
      email: parsed.data.email,
    };
  }

  // Same answer whether or not the account exists (no account enumeration).
  return {
    status: "success",
    message: `If ${parsed.data.email} has an account, a reset link is on its way. It expires in one hour.`,
    email: parsed.data.email,
  };
}

export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: firstFieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return {
      status: "error",
      message: "Your reset link has expired. Request a new one from the sign-in page.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const message =
      error.code === "same_password"
        ? "Choose a password you haven't used before."
        : error.code === "weak_password"
          ? "That password is too weak. Try a longer one."
          : "We couldn't update your password. Try again.";
    return { status: "error", message };
  }

  const user = await getCurrentUser();
  redirect(user ? homeFor(user.role) : "/login");
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
