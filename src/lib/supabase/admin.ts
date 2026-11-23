import "server-only";

import { createClient } from "@supabase/supabase-js";

import { requireSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/**
 * Service client with the SECRET key — bypasses RLS. Server-only; use only for admin tasks
 * (inviting users, seeding) after the caller's role has been checked.
 */
export function createSupabaseAdminClient() {
  const { url } = requireSupabasePublicEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey)
    throw new Error("SUPABASE_SECRET_KEY is not set (server-only, see .env.example).");

  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
