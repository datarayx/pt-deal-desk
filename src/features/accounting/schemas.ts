import { z } from "zod";

import { journalValidationError } from "@/features/accounting/logic";
import { optionalText, requiredText } from "@/lib/validation";

export const accountSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Use a four-digit account code."),
  name: requiredText(160, "Account name"),
  type: z.enum(["asset", "liability", "equity", "income", "expense"]),
  subtype: optionalText(60),
  parent_id: z.union([z.literal(""), z.uuid()]).transform((value) => (value === "" ? null : value)),
});

export type AccountInput = z.input<typeof accountSchema>;

export const journalLineSchema = z.object({
  account: z.string().trim().min(1, "Choose an account."),
  debit: z.string().trim(),
  credit: z.string().trim(),
  description: optionalText(500),
});

export const journalSchema = z
  .object({
    entry_date: z.iso.date("Enter a valid journal date."),
    reference: optionalText(60),
    memo: requiredText(1000, "Memo"),
    lines: z.array(journalLineSchema),
  })
  .superRefine((value, ctx) => {
    const error = journalValidationError(value.lines);
    if (error) ctx.addIssue({ code: "custom", path: ["lines"], message: error });
  });

export type JournalInput = z.input<typeof journalSchema>;

export const periodSchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose a valid month."),
  locked: z.boolean(),
});
