import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers, acting as the
 * signed-in user (RLS applies). Create one per request — never share it between requests.
 */
export async function createSupabaseServerClient() {
  // Read cookies first: it marks the caller as per-request, so prerendering stops here and
  // the build never needs the keys (a missing key then fails at request time, not build time).
  const cookieStore = await cookies();
  const { url, publishableKey } = requireSupabasePublicEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only. Safe to ignore:
          // the proxy refreshes the session on every request.
        }
      },
    },
  });
}
