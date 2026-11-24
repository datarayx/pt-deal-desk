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
