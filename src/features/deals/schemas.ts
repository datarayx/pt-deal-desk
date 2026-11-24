import { z } from "zod";

import { nairaAmount, optionalText, percent } from "@/lib/validation";

const optionalNaira = z
  .union([z.literal(""), nairaAmount])
  .transform((value) => (value === "" ? null : value));

const optionalWholeNumber = z
  .string()
  .trim()
  .regex(/^\d{1,3}$/, "Enter a whole number of months.")
  .refine((value) => Number(value) <= 120, "Tenor can't be more than 120 months.")
  .or(z.literal(""))
  .transform((value) => (value === "" ? null : Number(value)));

const optionalPercent = z
  .union([z.literal(""), percent("Rate")])
  .transform((value) => (value === "" ? null : value));

export const newDealSchema = z
  .object({
    client_id: z.uuid("Select a client."),
    financier_id: z.uuid("Select a financier."),
    facility_type_id: z.uuid("Select a facility type."),
    amount_requested: nairaAmount,
    amount_approved: optionalNaira,
    tenor_months: optionalWholeNumber,
    interest_rate_monthly: optionalPercent,
    purpose: optionalText(500),
    collateral_type: optionalText(120),
    collateral_value: optionalNaira,
    guarantor_name: optionalText(200),
    guarantor_cheques: z.enum(["yes", "no"]),
    other_fees_note: optionalText(500),
    referrer_id: z
      .union([z.literal(""), z.uuid()])
      .transform((value) => (value === "" ? null : value)),
    referral_fee_basis: z.enum(["none", "percent", "flat"]),
    referral_fee_value: z
      .string()
      .trim()
      .regex(/^\d{1,16}(\.\d{1,4})?$/, "Enter a valid referral fee.")
      .or(z.literal(""))
      .transform((value) => (value === "" ? null : value)),
  })
  .superRefine((value, ctx) => {
    if (value.referral_fee_basis === "none" && value.referral_fee_value !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["referral_fee_value"],
        message: "Choose a fee basis before entering a fee.",
      });
    }
    if (value.referral_fee_basis !== "none" && value.referrer_id === null) {
      ctx.addIssue({
        code: "custom",
        path: ["referrer_id"],
        message: "Select a referrer for a referral fee.",
      });
    }
    if (value.referral_fee_basis === "percent" && value.referral_fee_value !== null) {
      const numericValue = Number(value.referral_fee_value);
      if (numericValue > 100) {
        ctx.addIssue({
          code: "custom",
          path: ["referral_fee_value"],
          message: "A percentage cannot be more than 100%.",
        });
      }
    }
  });

export type NewDealInput = z.input<typeof newDealSchema>;

export const moveStageSchema = z.object({
  stage_name: z.string().trim().min(1, "Select a stage.").max(80),
  note: z.string().trim().max(1000, "The note must be 1,000 characters or fewer."),
});

export const dealOutcomeSchema = z.object({
  reason: z.string().trim().min(1, "A reason is required.").max(1000),
});

export const disburseDealSchema = z
  .object({
    amount: nairaAmount,
    disbursed_on: z.iso.date("Enter a valid disbursement date."),
    first_repayment_date: z.iso.date("Enter a valid first repayment date."),
    frequency: z.enum(["monthly", "quarterly", "bullet"]),
  })
  .refine((value) => value.first_repayment_date >= value.disbursed_on, {
    path: ["first_repayment_date"],
    message: "First repayment date cannot be before disbursement.",
  });

export type MoveStageInput = z.input<typeof moveStageSchema>;
export type DealOutcomeInput = z.input<typeof dealOutcomeSchema>;
export type DisburseDealInput = z.input<typeof disburseDealSchema>;
