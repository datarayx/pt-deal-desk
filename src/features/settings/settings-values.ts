import { z } from "zod";

import { REMINDER_DAY_CHOICES, WEEKDAYS } from "@/features/settings/schemas";

// Typed readers for the jsonb values in public.settings, with the documented defaults
// (DECISIONS.md) when a key is missing or malformed. Pure: no database access.

const num = (fallback: number) => z.coerce.number().catch(fallback);

export const reminderValues = z.object({
  reminder_days_before_due: z.array(z.number().int()).catch([7, 3, 0]),
  overdue_email_weekdays: z.array(z.enum(WEEKDAYS)).catch(["mon", "thu"]),
  stale_deal_days: num(30),
});
export type ReminderValues = z.infer<typeof reminderValues>;

export const feeValues = z.object({
  vat_rate_pct: num(7.5),
  wht_rate_pct: num(10),
  referral_fee_trigger: z.enum(["on_disbursement", "on_first_repayment"]).catch("on_disbursement"),
  fee_defaults: z
    .object({
      client_fee_pct: num(1.5),
      provider_commission_pct: num(1),
      collateral_fee: z
        .object({ basis: z.enum(["percent", "flat"]), value: z.union([z.number(), z.string()]) })
        .catch({ basis: "percent", value: 0.5 }),
    })
    .catch({
      client_fee_pct: 1.5,
      provider_commission_pct: 1,
      collateral_fee: { basis: "percent", value: 0.5 },
    }),
});
export type FeeValues = z.infer<typeof feeValues>;

export const companyValues = z
  .object({
    name: z.string().catch("P&T Finance Consult Limited"),
    rc_number: z.string().nullish().catch(null),
    tin: z.string().nullish().catch(null),
    address: z.string().nullish().catch(null),
    phone: z.string().nullish().catch(null),
    email: z.string().nullish().catch(null),
    website: z.string().nullish().catch(null),
    logo_path: z.string().nullish().catch(null),
  })
  .catch({ name: "P&T Finance Consult Limited" });
export type CompanyValues = z.infer<typeof companyValues>;

export const weekdayLabel: Record<(typeof WEEKDAYS)[number], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export function reminderDayLabel(days: number) {
  if (days === 0) return "On the due date";
  return days === 1 ? "1 day before" : `${days} days before`;
}

export { REMINDER_DAY_CHOICES };

export const referralTriggerLabel = {
  on_disbursement: "When the facility is disbursed",
  on_first_repayment: "When the client makes the first repayment",
} as const;

export const roleInfo = {
  ceo: { label: "CEO", description: "Everything, including settings, users and client KYC files." },
  accountant: {
    label: "Accountant",
    description: "Books, fees, repayments and reports. No settings, users or KYC documents.",
  },
} as const;
