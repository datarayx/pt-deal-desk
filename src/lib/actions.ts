// Shared result type and error mapping for Server Actions.
// Actions never throw database errors at the client: they return a plain-language message.

export type ActionResult<T = undefined> =
  { ok: true; data?: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };

type PostgrestLikeError = { code?: string; message?: string; details?: string | null } | null;

/** Turns a Supabase/Postgres error into a sentence a P&T user understands. */
export function friendlyDbError(error: PostgrestLikeError, what = "this item"): string {
  if (!error) return "Something went wrong. Try again.";
  switch (error.code) {
    case "23505":
      return `That name is already used. Choose a different one.`;
    case "23503":
      return `${capitalise(what)} is in use and can't be removed. Change the records that use it first.`;
    case "23514":
    case "22023":
      return error.message || "Some values aren't allowed. Check the form.";
    case "42501":
      return error.message?.startsWith("permission denied")
        ? "You don't have permission to do this."
        : error.message || "You don't have permission to do this.";
    case "PGRST116":
      return `${capitalise(what)} no longer exists. Refresh the page.`;
    default:
      return "Something went wrong saving your change. Try again.";
  }
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** zod issues → { field: first message } for form display. */
export function issuesToFieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
