// ⌘K matching: every word typed must start a word in the item's text ("trial" → "Run trial
// balance", "rec pay" → "Record a reported repayment"). Stricter than cmdk's default fuzzy match,
// which surfaced unrelated pages ("trial" → "Financiers").
// Returns a cmdk score: 0 hides the item; higher ranks first.

export function commandFilter(value: string, search: string, keywords?: string[]): number {
  const query = search.trim().toLowerCase();
  if (!query) return 1;

  const haystack = [value, ...(keywords ?? [])].join(" ").toLowerCase();
  const words = haystack.split(/[^a-z0-9₦]+/).filter(Boolean);
  const terms = query.split(/\s+/).filter(Boolean);

  const allMatch = terms.every((term) => words.some((word) => word.startsWith(term)));
  if (!allMatch) return 0;

  // Rank: phrase at the start of the label > phrase anywhere > words matched separately
  if (haystack.startsWith(query)) return 1;
  if (haystack.includes(query)) return 0.8;
  return 0.6;
}
