import { z } from "zod";

import {
  nigerianPhone,
  optionalEmail,
  optionalPercent,
  optionalText,
  requiredText,
} from "@/lib/validation";

export const FINANCIER_TYPES = ["finance_house", "bank", "capital_markets", "other"] as const;
export type FinancierType = (typeof FINANCIER_TYPES)[number];

export const financierTypeLabel: Record<FinancierType, string> = {
  finance_house: "Finance house",
  bank: "Bank",
  capital_markets: "Capital markets",
  other: "Other",
};

export const financierSchema = z
  .object({
    name: requiredText(160),
    financier_type: z.enum(FINANCIER_TYPES),
    contact_person: optionalText(120),
    phone: nigerianPhone,
    email: optionalEmail,
    // Interest rates are PER MONTH (AGENTS.md), e.g. 4.7–8.
    rate_min_monthly: optionalPercent("Lowest rate"),
    rate_max_monthly: optionalPercent("Highest rate"),
    facility_types: z.array(z.string().trim().min(1).max(80)).max(30),
    collateral_policy: optionalText(1000),
    notes: optionalText(2000),
  })
  .superRefine((v, ctx) => {
    if (
      v.rate_min_monthly &&
      v.rate_max_monthly &&
      Number(v.rate_min_monthly) > Number(v.rate_max_monthly)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["rate_max_monthly"],
        message: "The highest rate can't be below the lowest.",
      });
    }
  });
export type FinancierInput = z.input<typeof financierSchema>;

export const requirementSchema = z.object({
  item: requiredText(240, "Requirement"),
  is_required: z.boolean(),
});
export type RequirementInput = z.infer<typeof requirementSchema>;
