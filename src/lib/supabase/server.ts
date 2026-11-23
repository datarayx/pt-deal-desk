import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { requireSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers, acting as the
 * signed-in user (RLS applies). Create one per request — never share it between requests.
 */
export async function createSupabaseServerClient() {
  // Stop prerendering before touching Supabase: the client reads the clock (token expiry) and
  // the session is per-request. With partialPrefetching, cookies() alone no longer stops the
  // prerender, so connection() is needed too (Next 16 "blocking-prerender-current-time").
  // This also means the build never needs the keys — a missing key fails at request time.
  const cookieStore = await cookies();
  await connection();
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
