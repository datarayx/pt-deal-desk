import { z } from "zod";

// Field rules shared by forms (client) and Server Actions (server). Form fields arrive as
// strings; blanks become null; money and rates stay decimal strings (never floats).

export const requiredText = (max: number, label = "Name") =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`)
    .transform((v) => (v === "" ? null : v));

/** Nigerian phone → +234XXXXXXXXXX (accepts 0803…, spaces and dashes); blank → null. */
export const nigerianPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .transform((v) => (v.startsWith("0") && v.length === 11 ? `+234${v.slice(1)}` : v))
  .pipe(z.string().regex(/^(\+234[0-9]{10})?$/, "Use a Nigerian number like +234 803 123 4567"))
  .transform((v) => (v === "" ? null : v));

export const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));

export const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.union([z.literal(""), z.email("Enter a valid email address.")]))
  .transform((v) => (v === "" ? null : v));

/** "1.5" style percentage, 0–100, up to 3 decimals. */
export const percent = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,3}(\.\d{1,3})?$/, `${label}: enter a percentage like 1.5`)
    .refine((v) => Number(v) <= 100, `${label} can't be more than 100%.`);

export const optionalPercent = (label: string) =>
  z.union([z.literal("").transform(() => null), percent(label)]);

/** Naira amount → plain decimal string ("250000" or "250,000.00" → "250000" / "250000.00"). */
export const nairaAmount = z
  .string()
  .trim()
  .transform((v) => v.replace(/[₦,\s]/g, ""))
  .pipe(z.string().regex(/^\d{1,16}(\.\d{1,2})?$/, "Enter an amount like 250000 or 250,000.00"));

/** Optional 11-digit BVN or NIN (spaces allowed while typing); blank → null. */
export const elevenDigits = (label: "BVN" | "NIN") =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, ""))
    .pipe(z.string().regex(/^([0-9]{11})?$/, `${label} must be 11 digits.`))
    .transform((v) => (v === "" ? null : v));

/** Optional calendar date "YYYY-MM-DD"; blank → null. */
export const optionalDate = (label: string) =>
  z
    .string()
    .trim()
    .pipe(z.union([z.literal(""), z.iso.date(`${label}: enter a valid date.`)]))
    .transform((v) => (v === "" ? null : v));

/** Lagos "today" as YYYY-MM-DD. */
export function lagosToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(now);
}

/** Whole years between a YYYY-MM-DD date and Lagos today. */
export function ageInYears(dateOfBirth: string, now: Date = new Date()): number {
  const [by, bm, bd] = dateOfBirth.split("-").map(Number);
  const [ty, tm, td] = lagosToday(now).split("-").map(Number);
  let age = (ty ?? 0) - (by ?? 0);
  if ((tm ?? 0) < (bm ?? 0) || ((tm ?? 0) === (bm ?? 0) && (td ?? 0) < (bd ?? 0))) age -= 1;
  return age;
}

/**
 * CAC registration number by company type → "RC 1234567" / "BN 1234567" / "IT 1234567".
 * Accepts "rc1234567", "RC-1234567", "1234567" (prefix added from the type). Blank → null.
 * Ltd/Plc use RC, business names BN, incorporated trustees (NGOs) IT.
 */
export const CAC_PREFIX = { ltd: "RC", plc: "RC", bn: "BN", ngo: "IT" } as const;
export type CacResult = { ok: true; value: string | null } | { ok: false; error: string };

export function normaliseCacNumber(raw: string, companyType: keyof typeof CAC_PREFIX): CacResult {
  const compact = raw
    .trim()
    .toUpperCase()
    .replace(/[\s.\-/]/g, "");
  if (compact === "") return { ok: true, value: null };
  const match = /^(RC|BN|IT)?([0-9]{1,8})$/.exec(compact);
  if (!match) return { ok: false, error: "Use a CAC number like RC 1234567." };
  const expected = CAC_PREFIX[companyType];
  if (match[1] && match[1] !== expected) {
    const article = expected === "BN" ? "a" : "an";
    return {
      ok: false,
      error: `This company type is registered with ${article} ${expected} number.`,
    };
  }
  return { ok: true, value: `${expected} ${match[2]}` };
}
