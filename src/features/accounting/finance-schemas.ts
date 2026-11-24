import { z } from "zod";

import { nairaAmount, requiredText } from "@/lib/validation";

const optionalNaira = z
  .union([z.literal(""), nairaAmount])
  .transform((value) => (value === "" ? null : value));

export const feeReceiptSchema = z.object({
  received_on: z.iso.date("Enter a valid receipt date."),
  wht_amount: optionalNaira,
});

export type FeeReceiptInput = z.input<typeof feeReceiptSchema>;

export const referralPaymentSchema = z.object({
  paid_on: z.iso.date("Enter a valid payment date."),
});

export type ReferralPaymentInput = z.input<typeof referralPaymentSchema>;

export const expenseSchema = z.object({
  entry_date: z.iso.date("Enter a valid expense date."),
  expense_account: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Choose an expense account."),
  amount: nairaAmount,
  description: requiredText(500, "Description"),
});

export type ExpenseInput = z.input<typeof expenseSchema>;
