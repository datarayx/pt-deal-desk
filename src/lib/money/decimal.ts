/** Exact decimal helpers for monetary totals. Never use floating-point arithmetic for money. */
export function addDecimalStrings(
  left: string | null | undefined,
  right: string | null | undefined,
): string {
  const leftCents = toCents(left);
  const rightCents = toCents(right);
  return formatCents(leftCents + rightCents);
}

export function sumDecimalStrings(values: (string | null | undefined)[]): string {
  return values.reduce<string>((total, value) => addDecimalStrings(total, value), "0.00");
}

export function subtractDecimalStrings(
  left: string | null | undefined,
  right: string | null | undefined,
): string {
  const cents = toCents(left) - toCents(right);
  return cents < BigInt(0) ? `-${formatCents(-cents)}` : formatCents(cents);
}

function toCents(value: string | null | undefined): bigint {
  const normalized = (value ?? "0").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return BigInt(0);
  const [whole = "0", fraction = ""] = normalized.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}

function formatCents(cents: bigint): string {
  const whole = cents / BigInt(100);
  const fraction = (cents % BigInt(100)).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}
