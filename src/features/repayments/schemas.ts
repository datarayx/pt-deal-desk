import { z } from "zod";

import { nairaAmount, optionalText } from "@/lib/validation";

export const repaymentReportSchema = z.object({
  deal_id: z.uuid("Select a deal."),
  amount: nairaAmount,
  paid_on: z.iso.date("Enter a valid payment date."),
  channel: z.enum(["receipt", "bank_alert", "whatsapp", "other"]),
  proof_file_path: z.string().trim(),
});

export const confirmRepaymentSchema = z.object({
  confirmed_at: z.iso.date("Enter a valid confirmation date."),
  confirmation_note: optionalText(1000),
});

export type RepaymentReportInput = z.input<typeof repaymentReportSchema>;
export type ConfirmRepaymentInput = z.input<typeof confirmRepaymentSchema>;

export const repaymentChannelLabel = {
  receipt: "Receipt",
  bank_alert: "Bank alert",
  whatsapp: "WhatsApp",
  other: "Other",
} as const;

export const repaymentTab = z.enum(["due", "overdue", "reported", "confirmed"]);
export type RepaymentTab = z.infer<typeof repaymentTab>;
