// One place that decides how each domain status looks (DESIGN.md §3: status colour always paired
// with a label). Enum values follow docs/DATA_MODEL.md.

export type StatusTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

export type StatusPreset = { label: string; tone: StatusTone };

export const repaymentStatus = {
  scheduled: { label: "Scheduled", tone: "neutral" },
  due: { label: "Due", tone: "warning" },
  reported: { label: "Reported", tone: "info" },
  confirmed: { label: "Confirmed", tone: "success" },
  partially_paid: { label: "Partially paid", tone: "warning" },
  overdue: { label: "Overdue", tone: "danger" },
} as const satisfies Record<string, StatusPreset>;

export const kycStatus = {
  incomplete: { label: "Incomplete", tone: "warning" },
  submitted: { label: "Submitted", tone: "info" },
  verified: { label: "Verified", tone: "success" },
} as const satisfies Record<string, StatusPreset>;

export const dealOutcome = {
  open: { label: "Open", tone: "neutral" },
  negotiating: { label: "Negotiating", tone: "info" },
  declined_by_lender: { label: "Declined by lender", tone: "danger" },
  declined_by_client: { label: "Declined by client", tone: "danger" },
  defaulted: { label: "Defaulted", tone: "danger" },
  completed: { label: "Completed", tone: "success" },
} as const satisfies Record<string, StatusPreset>;

export const feeStatus = {
  pending: { label: "Pending", tone: "neutral" },
  earned: { label: "Earned", tone: "accent" },
  received: { label: "Received", tone: "success" },
  paid: { label: "Paid", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
} as const satisfies Record<string, StatusPreset>;

export const documentStatus = {
  missing: { label: "Missing", tone: "warning" },
  received: { label: "Received", tone: "info" },
  verified: { label: "Verified", tone: "success" },
  expired: { label: "Expired", tone: "danger" },
} as const satisfies Record<string, StatusPreset>;

export const reliability = {
  good: { label: "Good", tone: "success" },
  watch: { label: "Watch", tone: "warning" },
  high_risk: { label: "High risk", tone: "danger" },
} as const satisfies Record<string, StatusPreset>;
