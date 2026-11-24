import { z } from "zod";

import {
  nairaAmount,
  nigerianPhone,
  optionalEmail,
  optionalText,
  percent,
  requiredText,
} from "@/lib/validation";

export const REFERRER_TYPES = [
  "consultant",
  "advisory_firm",
  "past_client",
  "individual",
  "other",
] as const;
export type ReferrerType = (typeof REFERRER_TYPES)[number];

export const referrerTypeLabel: Record<ReferrerType, string> = {
  consultant: "Consultant",
  advisory_firm: "Advisory firm",
  past_client: "Past client",
  individual: "Individual",
  other: "Other",
};

/** Flat fees: at most ₦999,999,999,999.99 (≤ 14 significant digits) so the value survives JSON exactly. */
const flatFee = nairaAmount.pipe(
  z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, "That amount is too large."),
);

export const referrerSchema = z
  .object({
    name: requiredText(160),
    referrer_type: z.enum(REFERRER_TYPES),
    contact_person: optionalText(120),
    phone: nigerianPhone,
    email: optionalEmail,
    // The usual fee; each deal still records its own agreed fee (PRD M3).
    default_fee_type: z.enum(["none", "percent", "flat"]),
    default_fee_value: z.string().trim(),
    bank_name: optionalText(120),
    account_name: optionalText(160),
  })
  .superRefine((v, ctx) => {
    if (v.default_fee_type === "none") return;
    const check =
      v.default_fee_type === "percent"
        ? percent("Fee").safeParse(v.default_fee_value)
        : flatFee.safeParse(v.default_fee_value);
    if (!check.success) {
      ctx.addIssue({
        code: "custom",
        path: ["default_fee_value"],
        message: check.error.issues[0]?.message ?? "Enter the usual fee.",
      });
    }
  })
  .transform(({ default_fee_type, default_fee_value, ...rest }) => ({
    ...rest,
    default_fee_type: default_fee_type === "none" ? null : default_fee_type,
    default_fee_value:
      default_fee_type === "none" ? null : default_fee_value.replace(/[₦,\s]/g, ""),
  }));
export type ReferrerInput = z.input<typeof referrerSchema>;
