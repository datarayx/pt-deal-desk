import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { isRole, type Role } from "@/lib/auth/access";
import type { SupabasePublicEnv } from "@/lib/supabase/env";

export type ProxySession = {
  /** Pass-through response carrying any refreshed auth cookies and no-cache headers. */
  response: NextResponse;
  userId: string | null;
  /** Active role from `profiles`, or null when signed out, without a profile, or inactive. */
  role: Role | null;
};

/**
 * Refreshes the Supabase session for this request and looks up the user's role.
 * Must run on every matched request so tokens are rotated before Server Components read them.
 */
export async function getProxySession(
  request: NextRequest,
  env: SupabasePublicEnv,
): Promise<ProxySession> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // Validates the JWT (do not use getSession() on the server — it is not verified).
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!userId) return { response, userId: null, role: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .maybeSingle();

  const role = profile?.is_active && isRole(profile.role) ? profile.role : null;
  return { response, userId, role };
}

/** Redirect that keeps the refreshed auth cookies and cache headers from `from`. */
export function redirectWithSession(from: NextResponse, url: URL): NextResponse {
  const redirect = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  for (const key of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(key);
    if (value) redirect.headers.set(key, value);
  }
  return redirect;
}
