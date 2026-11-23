import { createBrowserClient } from "@supabase/ssr";

import { requireSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/** Supabase client for Client Components (acts as the signed-in user; RLS applies). */
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = requireSupabasePublicEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
