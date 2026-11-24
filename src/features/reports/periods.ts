import type { PeriodRange } from "@/features/reports/logic";

export type PeriodPreset = "month" | "quarter" | "year" | "custom";

export function isoMonth(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

export function rangeForMonth(value: string): PeriodRange {
  const [year, month] = value.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${value}-01`, to: `${value}-${String(last).padStart(2, "0")}`, label: value };
}

export function rangeForQuarter(value: string): PeriodRange {
  const [yearValue, quarterValue] = value.split("-Q");
  const year = Number(yearValue);
  const quarter = Number(quarterValue);
  const startMonth = (quarter - 1) * 3 + 1;
  const from = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const last = new Date(Date.UTC(year, startMonth + 2, 0)).getUTCDate();
  const to = `${year}-${String(startMonth + 2).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { from, to, label: `${year} Q${quarter}` };
}

export function rangeForYear(value: string): PeriodRange {
  return { from: `${value}-01-01`, to: `${value}-12-31`, label: value };
}

export function currentYear(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric" }).format(
    date,
  );
}

export function currentQuarter(date = new Date()) {
  const month = Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", month: "numeric" }).format(date),
  );
  return `${currentYear(date)}-Q${Math.ceil(month / 3)}`;
}

export function rangeFromPreset(
  preset: PeriodPreset,
  value: string,
  customFrom: string,
  customTo: string,
): PeriodRange {
  if (preset === "quarter") return rangeForQuarter(value);
  if (preset === "year") return rangeForYear(value);
  if (preset === "custom")
    return { from: customFrom, to: customTo, label: `${customFrom} to ${customTo}` };
  return rangeForMonth(value);
}
