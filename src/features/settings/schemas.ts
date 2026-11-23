import { z } from "zod";

// Shared by the Settings forms (client validation) and Server Actions (re-validated on the server).
// Form number fields are strings; percentages are converted on the server, money stays a string.

const name = (max: number, label = "Name") =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const percent = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,3}(\.\d{1,3})?$/, `${label}: enter a percentage like 1.5`)
    .refine((v) => Number(v) <= 100, `${label} can't be more than 100%.`);

const nairaAmount = z
  .string()
  .trim()
  .transform((v) => v.replace(/[₦,\s]/g, ""))
  .pipe(z.string().regex(/^\d{1,16}(\.\d{1,2})?$/, "Enter an amount like 250000 or 250,000.00"));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`)
    .transform((v) => (v === "" ? null : v));

const nigerianPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .transform((v) => (v.startsWith("0") && v.length === 11 ? `+234${v.slice(1)}` : v))
  .pipe(z.string().regex(/^(\+234[0-9]{10})?$/, "Use a Nigerian number like +234 803 123 4567"))
  .transform((v) => (v === "" ? null : v));

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));

// ---------------------------------------------------------------------------
export const STAGE_COLORS = [
  "#7C93AB",
  "#00B29E",
  "#00796F",
  "#011A32",
  "#1D4ED8",
  "#B45309",
  "#047857",
  "#B91C1C",
] as const;

export const stageSchema = z.object({
  name: name(80),
  color: z.enum(STAGE_COLORS),
  is_terminal: z.boolean(),
});
export type StageInput = z.infer<typeof stageSchema>;

export const facilityTypeSchema = z.object({ name: name(80) });
export type FacilityTypeInput = z.infer<typeof facilityTypeSchema>;

export const kycDocTypeSchema = z.object({
  client_type: z.enum(["individual", "company"]),
  name: name(160, "Document name"),
  is_required: z.boolean(),
  has_expiry: z.boolean(),
});
export type KycDocTypeInput = z.infer<typeof kycDocTypeSchema>;

export const ALERT_TYPES = ["due_soon", "due_today", "overdue", "stale_deal"] as const;
export const alertTypeLabel: Record<(typeof ALERT_TYPES)[number], string> = {
  due_soon: "Due soon",
  due_today: "Due today",
  overdue: "Overdue",
  stale_deal: "Stale deals",
};

export const recipientSchema = z.object({
  name: name(120),
  title: optionalText(120),
  email,
  alert_types: z.array(z.enum(ALERT_TYPES)).min(1, "Choose at least one alert."),
  is_active: z.boolean(),
});
export type RecipientInput = z.input<typeof recipientSchema>;

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const REMINDER_DAY_CHOICES = [14, 10, 7, 5, 3, 2, 1, 0] as const;

export const reminderSettingsSchema = z.object({
  reminder_days_before_due: z
    .array(z.number().int().min(0).max(30))
    .min(1, "Choose at least one reminder.")
    .max(6, "Choose at most six reminders.")
    .transform((days) => [...new Set(days)].sort((a, b) => b - a)),
  overdue_email_weekdays: z.array(z.enum(WEEKDAYS)).min(1, "Choose at least one day."),
  stale_deal_days: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, "Enter a whole number of days.")
    .refine((v) => Number(v) >= 7 && Number(v) <= 180, "Use between 7 and 180 days."),
});
export type ReminderSettingsInput = z.input<typeof reminderSettingsSchema>;

export const feeDefaultsSchema = z
  .object({
    vat_rate_pct: percent("VAT"),
    wht_rate_pct: percent("WHT"),
    referral_fee_trigger: z.enum(["on_disbursement", "on_first_repayment"]),
    client_fee_pct: percent("Client fee"),
    provider_commission_pct: percent("Provider commission"),
    collateral_fee_basis: z.enum(["percent", "flat"]),
    collateral_fee_value: z.string().trim().min(1, "Enter a value."),
  })
  .superRefine((v, ctx) => {
    const check =
      v.collateral_fee_basis === "percent"
        ? percent("Collateral fee").safeParse(v.collateral_fee_value)
        : nairaAmount.safeParse(v.collateral_fee_value);
    if (!check.success) {
      ctx.addIssue({
        code: "custom",
        path: ["collateral_fee_value"],
        message: check.error.issues[0]?.message ?? "Invalid value.",
      });
    }
  });
export type FeeDefaultsInput = z.input<typeof feeDefaultsSchema>;

export const companyProfileSchema = z.object({
  name: name(200, "Company name"),
  rc_number: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^((RC|BN|IT) ?[0-9]{1,8})?$/, "Use a CAC number like RC 1234567")
    .transform((v) => (v === "" ? null : v)),
  tin: optionalText(20),
  address: optionalText(300),
  phone: nigerianPhone,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.union([z.literal(""), z.email("Enter a valid email address.")]))
    .transform((v) => (v === "" ? null : v)),
  website: optionalText(200),
});
export type CompanyProfileInput = z.input<typeof companyProfileSchema>;

export const ROLES = ["ceo", "accountant"] as const;

export const inviteUserSchema = z.object({
  full_name: name(120, "Full name"),
  email,
  role: z.enum(ROLES),
});
export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const updateUserSchema = z.object({
  full_name: name(120, "Full name"),
  role: z.enum(ROLES),
  is_active: z.boolean(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const LOGO_MAX_BYTES = 1024 * 1024;

export { nairaAmount };
