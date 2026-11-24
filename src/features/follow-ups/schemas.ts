import { z } from "zod";

import { optionalDate, requiredText } from "@/lib/validation";

export const callLogSchema = z.object({
  outcome: requiredText(1000, "Call outcome"),
  promise_to_pay_date: optionalDate("Promise-to-pay date"),
});

export type CallLogInput = z.input<typeof callLogSchema>;
