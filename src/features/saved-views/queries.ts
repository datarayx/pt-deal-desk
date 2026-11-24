import "server-only";

import { type SavedView, tableKeySchema, viewStateSchema } from "@/features/saved-views/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** The signed-in user's saved views for one table, by name. RLS limits rows to their own. */
export async function getSavedViews(tableKey: string): Promise<SavedView[]> {
  const key = tableKeySchema.parse(tableKey);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("saved_views")
    .select("id, name, filters, columns")
    .eq("table_key", key)
    .order("name");
  if (error) throw new Error(error.message);
  return data.flatMap((row) => {
    const filters = (row.filters ?? {}) as Record<string, unknown>;
    const parsed = viewStateSchema.safeParse({ ...filters, hidden: row.columns });
    return parsed.success ? [{ id: row.id, name: row.name, state: parsed.data }] : [];
  });
}
