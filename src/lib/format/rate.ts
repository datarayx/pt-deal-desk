// Interest rates are PER MONTH everywhere (AGENTS.md). Rates are small decimals (numeric(6,3)),
// not money, so formatting through Number is safe.

const pct = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 3 });

type RateValue = string | number | null | undefined;

function toNumber(v: RateValue): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** "4.7%" (no suffix) or null. */
export function formatRate(v: RateValue): string | null {
  const n = toNumber(v);
  return n === null ? null : `${pct.format(n)}%`;
}

/** "4.7%–6% per month", "from 5% per month", "up to 8% per month", or null when unknown. */
export function formatRateRange(min: RateValue, max: RateValue): string | null {
  const lo = formatRate(min);
  const hi = formatRate(max);
  if (lo && hi) return lo === hi ? `${lo} per month` : `${lo}–${hi} per month`;
  if (lo) return `from ${lo} per month`;
  if (hi) return `up to ${hi} per month`;
  return null;
}
