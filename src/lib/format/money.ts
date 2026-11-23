// Naira formatting (AGENTS.md: ₦1,250,000.00 via Intl en-NG).
// Money arrives from Postgres as a decimal *string* (numeric(18,2) cast to text) and is passed to
// Intl as a string, which formats it exactly — no float rounding. Numbers are accepted for
// convenience (e.g. literals in the styleguide) but never do arithmetic on them.

export type MoneyValue = string | number | bigint;

const DECIMAL_STRING = /^-?\d+(\.\d+)?$/;

const standard = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  signDisplay: "negative", // "-₦0.00" never appears for values that round to zero
});

const compact = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  notation: "compact",
  maximumFractionDigits: 2,
  signDisplay: "negative",
});

function normalise(value: MoneyValue): Intl.StringNumericLiteral | number | bigint | null {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const trimmed = value.trim();
  return DECIMAL_STRING.test(trimmed) ? (trimmed as Intl.StringNumericLiteral) : null;
}

export type FormatNairaOptions = {
  /** "₦1.25B" style, for KPI cards and chart axes. */
  compact?: boolean;
};

/** Formats a naira amount. Returns null when the value is not a valid number. */
export function formatNaira(value: MoneyValue, options: FormatNairaOptions = {}): string | null {
  const normalised = normalise(value);
  if (normalised === null) return null;
  return (options.compact ? compact : standard).format(normalised);
}

/** True when the value is below zero *after* rounding to kobo (so -0.004 is not negative). */
export function isNegativeMoney(value: MoneyValue): boolean {
  const formatted = formatNaira(value);
  return formatted !== null && formatted.startsWith("-");
}
