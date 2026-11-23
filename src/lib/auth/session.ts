import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { homeFor, isRole, type Role } from "@/lib/auth/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

/**
 * The signed-in, active user with their role — or null. Cached per request, so the shell,
 * the page and Server Actions share one lookup. Reads cookies, so call it inside <Suspense>
 * (Next 16 cacheComponents) or from a Server Action / Route Handler.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.is_active || !isRole(profile.role)) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.full_name || profile.email,
    role: profile.role,
  };
});

/** For pages and layouts: the current user, or a redirect to /login. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * For Server Actions and pages: re-checks the role on the server (SECURITY.md — never trust
 * the client). Redirects a signed-in user without the role to their home page.
 */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}
