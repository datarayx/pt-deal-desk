import { z } from "zod";

// A saved view = the table state a user wants back: search text, column filters, sorting and
// hidden columns. Stored per user in public.saved_views (RLS: own rows only).

export const tableKeySchema = z.string().regex(/^[a-z][a-z0-9_.-]{0,60}$/, "Unknown table.");

export const viewStateSchema = z.object({
  search: z.string().max(200).default(""),
  filters: z
    .array(z.object({ id: z.string().max(60), value: z.array(z.string().max(120)).max(50) }))
    .max(20)
    .default([]),
  sorting: z
    .array(z.object({ id: z.string().max(60), desc: z.boolean() }))
    .max(5)
    .default([]),
  hidden: z.array(z.string().max(60)).max(40).default([]),
});
export type ViewState = z.infer<typeof viewStateSchema>;

export const saveViewSchema = z.object({
  tableKey: tableKeySchema,
  name: z.string().trim().min(1, "Name the view.").max(80, "Use 80 characters or fewer."),
  state: viewStateSchema,
});

export type SavedView = { id: string; name: string; state: ViewState };
