import { addDecimalStrings, subtractDecimalStrings, sumDecimalStrings } from "@/lib/money/decimal";

export type DashboardKpi = { current: string | number; previous: string | number };

export type DashboardDeal = {
  id: string;
  reference: string;
  client_id: string;
  client_name: string;
  financier_name: string | null;
  stage_name: string;
  stage_color: string | null;
  outcome:
    | "open"
    | "negotiating"
    | "declined_by_lender"
    | "declined_by_client"
    | "defaulted"
    | "completed";
  amount_requested: string | null;
  amount_approved: string | null;
  amount_disbursed: string | null;
  stage_entered_at: string;
  created_at: string;
  deficiency_count: number;
  is_terminal: boolean;
};

export type DashboardSchedule = {
  id: string;
  deal_id: string;
  instalment_no: number;
  due_date: string;
  total_due: string;
  status: "scheduled" | "due" | "reported" | "confirmed" | "partially_paid" | "overdue";
  created_at: string;
};

export type DashboardReport = {
  schedule_id: string;
  amount: string;
  paid_on: string;
  confirmed_by_financier: boolean;
  confirmed_at: string | null;
};

export type DashboardFee = {
  id: string;
  fee_kind: "provider_commission" | "client_fee" | "collateral_fee" | "referral_fee";
  computed_amount: string | null;
  vat_amount: string;
  status: "pending" | "earned" | "received" | "paid" | "cancelled";
  earned_at: string | null;
};

export type DashboardReceipt = { source_id: string | null; entry_date: string };

export type MonthRange = { from: string; to: string; label: string };

export function monthRange(value: string): MonthRange {
  const [year, month] = value.slice(0, 7).split("-").map(Number);
  const start = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, 1));
  const end = new Date(Date.UTC(year ?? 1970, month ?? 1, 0));
  const from = start.toISOString().slice(0, 10);
  const to = end.toISOString().slice(0, 10);
  return {
    from,
    to,
    label: new Intl.DateTimeFormat("en-NG", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(start),
  };
}

export function previousMonth(value: MonthRange) {
  const start = new Date(`${value.from}T00:00:00Z`);
  start.setUTCMonth(start.getUTCMonth() - 1);
  return monthRange(start.toISOString());
}

export function activeDeal(deal: DashboardDeal) {
  return !deal.is_terminal && (deal.outcome === "open" || deal.outcome === "negotiating");
}

export function dealAmount(deal: DashboardDeal) {
  return deal.amount_disbursed ?? deal.amount_approved ?? deal.amount_requested ?? "0.00";
}

export function confirmedPaidBySchedule(reports: DashboardReport[], asOf?: string) {
  return reports
    .filter(
      (report) =>
        report.confirmed_by_financier && (!asOf || (report.confirmed_at ?? report.paid_on) <= asOf),
    )
    .reduce((total, report) => addDecimalStrings(total, report.amount), "0.00");
}

export function outstandingForSchedule(
  schedule: DashboardSchedule,
  reports: DashboardReport[],
  asOf?: string,
) {
  const paid = confirmedPaidBySchedule(reports, asOf);
  const outstanding = subtractDecimalStrings(schedule.total_due, paid);
  return outstanding.startsWith("-") ? "0.00" : outstanding;
}

export function sumOutstanding(
  schedules: DashboardSchedule[],
  reportsBySchedule: Map<string, DashboardReport[]>,
  asOf?: string,
) {
  return sumDecimalStrings(
    schedules
      .filter((schedule) => !asOf || schedule.created_at.slice(0, 10) <= asOf)
      .map((schedule) =>
        outstandingForSchedule(schedule, reportsBySchedule.get(schedule.id) ?? [], asOf),
      ),
  );
}

export function percentageDelta(current: string | number, previous: string | number) {
  const currentNumber = Number(current);
  const previousNumber = Number(previous);
  if (!Number.isFinite(currentNumber) || !Number.isFinite(previousNumber)) {
    return { value: "—", trend: "flat" as const };
  }
  if (previousNumber === 0) {
    return currentNumber === 0
      ? { value: "0%", trend: "flat" as const }
      : { value: "New", trend: "up" as const };
  }
  const change = ((currentNumber - previousNumber) / Math.abs(previousNumber)) * 100;
  const rounded = Math.round(change * 10) / 10;
  return {
    value: `${rounded > 0 ? "+" : ""}${rounded}%`,
    trend: rounded === 0 ? ("flat" as const) : rounded > 0 ? ("up" as const) : ("down" as const),
  };
}

export function currentMonthValue(value: string | null, range: MonthRange) {
  return Boolean(value && value.slice(0, 10) >= range.from && value.slice(0, 10) <= range.to);
}

export function monthKey(value: string) {
  return value.slice(0, 7);
}

export function monthLabels(today: string, count = 6) {
  const start = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setUTCMonth(start.getUTCMonth() - (count - 1 - index));
    const iso = date.toISOString().slice(0, 7);
    return {
      key: iso,
      label: new Intl.DateTimeFormat("en-NG", { month: "short", timeZone: "UTC" }).format(date),
    };
  });
}
