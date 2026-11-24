import "server-only";

import { requireRole } from "@/lib/auth/session";
import { sumDecimalStrings } from "@/lib/money/decimal";
import { lagosToday } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  activeDeal,
  currentMonthValue,
  dealAmount,
  monthKey,
  monthLabels,
  monthRange,
  outstandingForSchedule,
  percentageDelta,
  previousMonth,
  sumOutstanding,
  type DashboardKpi,
  type DashboardDeal,
  type DashboardFee,
  type DashboardReport,
  type DashboardSchedule,
} from "@/features/dashboard/logic";

export type OngoingTransaction = DashboardDeal & { days_in_stage: number };
export type DashboardRepayment = DashboardSchedule & {
  client_name: string;
  reference: string;
  outstanding: string;
  days_until_due: number;
  days_overdue: number;
};

export type PipelineChartRow = {
  stage: string;
  value: number;
  count: number;
  color: string | null;
};
export type FeeChartRow = { month: string; earned: number; received: number };
export type ReferrerRow = {
  id: string;
  name: string;
  deals_funded: number;
  amount_funded: string;
  fees_earned: string;
};
export type RepaymentChartRow = { label: string; amount: number; count: number };
export type AgeingChartRow = { bucket: string; amount: number; count: number };

export type DashboardData = {
  today: string;
  monthLabel: string;
  kpis: {
    activeDeals: DashboardKpi;
    pipelineValue: DashboardKpi;
    outstandingBalance: DashboardKpi;
    overdueAmount: DashboardKpi;
    feesEarnedMtd: DashboardKpi;
    feesEarnedYtd: DashboardKpi;
    feesReceivable: DashboardKpi;
  };
  ongoingTransactions: OngoingTransaction[];
  dueSoon: DashboardRepayment[];
  overdue: DashboardRepayment[];
  pipeline: PipelineChartRow[];
  feesByMonth: FeeChartRow[];
  repaymentsDue30: RepaymentChartRow[];
  overdueAgeing: AgeingChartRow[];
  topReferrers: ReferrerRow[];
};

function daysBetween(later: string, earlier: string) {
  const laterDate = new Date(`${later.slice(0, 10)}T00:00:00Z`).getTime();
  const earlierDate = new Date(`${earlier.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((laterDate - earlierDate) / 86_400_000);
}

function previousCutoff(today: string) {
  const current = monthRange(today);
  return previousMonth(current).to;
}

function dueRows(
  schedules: DashboardSchedule[],
  reportsBySchedule: Map<string, DashboardReport[]>,
  dealsById: Map<string, DashboardDeal>,
  today: string,
  include: (days: number) => boolean,
) {
  return schedules
    .map((schedule) => {
      const deal = dealsById.get(schedule.deal_id);
      if (!deal) return null;
      const outstanding = outstandingForSchedule(
        schedule,
        reportsBySchedule.get(schedule.id) ?? [],
      );
      const days = daysBetween(schedule.due_date, today);
      return {
        ...schedule,
        client_name: deal.client_name,
        reference: deal.reference,
        outstanding,
        days_until_due: days,
        days_overdue: Math.max(0, -days),
      } satisfies DashboardRepayment;
    })
    .filter((row): row is DashboardRepayment =>
      Boolean(row && Number(row.outstanding) > 0 && include(row.days_until_due)),
    )
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

export async function getDashboardData(): Promise<DashboardData> {
  await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const today = lagosToday();
  const currentMonth = monthRange(today);
  const previousMonthRange = previousMonth(currentMonth);
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const previousCutoffDate = previousCutoff(today);

  const [
    dealsResult,
    schedulesResult,
    reportsResult,
    feesResult,
    receiptsResult,
    pipelineResult,
    referrerStatsResult,
    referrersResult,
  ] = await Promise.all([
    supabase
      .from("deals")
      .select(
        "id, reference, client_id, amount_requested::text, amount_approved::text, amount_disbursed::text, outcome, stage_entered_at, created_at, clients(display_name), financiers(name), deal_stages!deals_stage_id_fkey(name, color, is_terminal)",
      )
      .order("stage_entered_at"),
    supabase
      .from("repayment_schedules")
      .select("id, deal_id, instalment_no, due_date, total_due::text, status, created_at")
      .order("due_date"),
    supabase
      .from("repayment_reports")
      .select("schedule_id, amount::text, paid_on, confirmed_by_financier, confirmed_at"),
    supabase
      .from("deal_fees")
      .select("id, fee_kind, computed_amount::text, vat_amount::text, status, earned_at")
      .neq("status", "cancelled"),
    supabase
      .from("journal_entries")
      .select("source_id, entry_date")
      .eq("source", "receipt")
      .eq("posted", true),
    supabase
      .from("v_pipeline_by_stage")
      .select("stage_name, deal_count, pipeline_value")
      .order("sort_order"),
    supabase
      .from("v_referrer_stats")
      .select("referrer_id, deals_funded, amount_funded, fees_earned")
      .order("deals_funded", { ascending: false })
      .limit(5),
    supabase.from("referrers").select("id, name"),
  ]);
  for (const result of [
    dealsResult,
    schedulesResult,
    reportsResult,
    feesResult,
    receiptsResult,
    pipelineResult,
    referrerStatsResult,
    referrersResult,
  ]) {
    if (result.error) throw new Error(result.error.message);
  }

  const dealIds = (dealsResult.data ?? []).map((deal) => deal.id);
  const requirementsResult = dealIds.length
    ? await supabase
        .from("deal_requirements")
        .select("deal_id, is_required, status")
        .in("deal_id", dealIds)
    : { data: [], error: null };
  if (requirementsResult.error) throw new Error(requirementsResult.error.message);
  const deficiencies = new Map<string, number>();
  for (const requirement of requirementsResult.data ?? []) {
    if (requirement.is_required && requirement.status === "pending") {
      deficiencies.set(requirement.deal_id, (deficiencies.get(requirement.deal_id) ?? 0) + 1);
    }
  }

  const deals: DashboardDeal[] = (dealsResult.data ?? []).map((deal) => ({
    id: deal.id,
    reference: deal.reference,
    client_id: deal.client_id,
    client_name: deal.clients?.display_name ?? "Unknown client",
    financier_name: deal.financiers?.name ?? null,
    stage_name: deal.deal_stages?.name ?? "Unknown stage",
    stage_color: deal.deal_stages?.color ?? null,
    outcome: deal.outcome,
    amount_requested: deal.amount_requested,
    amount_approved: deal.amount_approved,
    amount_disbursed: deal.amount_disbursed,
    stage_entered_at: deal.stage_entered_at,
    created_at: deal.created_at,
    deficiency_count: deficiencies.get(deal.id) ?? 0,
    is_terminal: deal.deal_stages?.is_terminal ?? false,
  }));
  const dealsById = new Map(deals.map((deal) => [deal.id, deal]));

  const schedules: DashboardSchedule[] = (schedulesResult.data ?? []).map((schedule) => ({
    id: schedule.id,
    deal_id: schedule.deal_id,
    instalment_no: schedule.instalment_no,
    due_date: schedule.due_date,
    total_due: String(schedule.total_due ?? "0.00"),
    status: schedule.status,
    created_at: schedule.created_at,
  }));
  const reports: DashboardReport[] = (reportsResult.data ?? []).map((report) => ({
    schedule_id: report.schedule_id,
    amount: String(report.amount ?? "0.00"),
    paid_on: report.paid_on,
    confirmed_by_financier: report.confirmed_by_financier,
    confirmed_at: report.confirmed_at,
  }));
  const reportsBySchedule = new Map<string, DashboardReport[]>();
  for (const report of reports) {
    const current = reportsBySchedule.get(report.schedule_id) ?? [];
    current.push(report);
    reportsBySchedule.set(report.schedule_id, current);
  }

  const fees: DashboardFee[] = (feesResult.data ?? []).map((fee) => ({
    id: fee.id,
    fee_kind: fee.fee_kind,
    computed_amount: fee.computed_amount === null ? null : String(fee.computed_amount),
    vat_amount: String(fee.vat_amount ?? "0.00"),
    status: fee.status,
    earned_at: fee.earned_at,
  }));
  const receipts = (receiptsResult.data ?? []) as {
    source_id: string | null;
    entry_date: string;
  }[];
  const receiptDates = new Map(
    receipts.flatMap((receipt) =>
      receipt.source_id ? [[receipt.source_id, receipt.entry_date] as const] : [],
    ),
  );

  const activeDeals = deals.filter(activeDeal);
  const activeDealsPrior = activeDeals.filter(
    (deal) => deal.created_at.slice(0, 10) <= previousCutoffDate,
  );
  const pipelineValue = sumDecimalStrings(activeDeals.map(dealAmount));
  const pipelineValuePrior = sumDecimalStrings(activeDealsPrior.map(dealAmount));
  const outstandingBalance = sumOutstanding(schedules, reportsBySchedule);
  const outstandingBalancePrior = sumOutstanding(schedules, reportsBySchedule, previousCutoffDate);
  const overdueAmount = sumDecimalStrings(
    schedules
      .filter((schedule) => schedule.due_date < today)
      .map((schedule) =>
        outstandingForSchedule(schedule, reportsBySchedule.get(schedule.id) ?? []),
      ),
  );
  const overdueAmountPrior = sumDecimalStrings(
    schedules
      .filter((schedule) => schedule.due_date <= previousCutoffDate)
      .map((schedule) =>
        outstandingForSchedule(
          schedule,
          reportsBySchedule.get(schedule.id) ?? [],
          previousCutoffDate,
        ),
      ),
  );
  const earnedAmount = (fee: DashboardFee) => fee.computed_amount ?? "0.00";
  const earnedMtd = sumDecimalStrings(
    fees
      .filter(
        (fee) =>
          ["earned", "received", "paid"].includes(fee.status) &&
          currentMonthValue(fee.earned_at, currentMonth),
      )
      .map(earnedAmount),
  );
  const earnedMtdPrior = sumDecimalStrings(
    fees
      .filter(
        (fee) =>
          ["earned", "received", "paid"].includes(fee.status) &&
          fee.earned_at &&
          fee.earned_at.slice(0, 10) >= previousMonthRange.from &&
          fee.earned_at.slice(0, 10) <= previousMonthRange.to,
      )
      .map(earnedAmount),
  );
  const earnedYtd = sumDecimalStrings(
    fees
      .filter(
        (fee) =>
          ["earned", "received", "paid"].includes(fee.status) &&
          fee.earned_at &&
          fee.earned_at.slice(0, 10) >= yearStart &&
          fee.earned_at.slice(0, 10) <= today,
      )
      .map(earnedAmount),
  );
  const earnedYtdPrior = sumDecimalStrings(
    fees
      .filter(
        (fee) =>
          ["earned", "received", "paid"].includes(fee.status) &&
          fee.earned_at &&
          fee.earned_at.slice(0, 10) >= `${Number(today.slice(0, 4)) - 1}-01-01` &&
          fee.earned_at.slice(0, 10) <= `${Number(today.slice(0, 4)) - 1}-${today.slice(5)}`,
      )
      .map(earnedAmount),
  );
  const receivable = sumDecimalStrings(
    fees
      .filter((fee) => fee.status === "earned" && fee.fee_kind !== "referral_fee")
      .map((fee) => sumDecimalStrings([earnedAmount(fee), fee.vat_amount])),
  );
  const receivablePrior = sumDecimalStrings(
    fees
      .filter(
        (fee) =>
          fee.status === "earned" &&
          fee.fee_kind !== "referral_fee" &&
          fee.earned_at &&
          fee.earned_at.slice(0, 10) <= previousCutoffDate,
      )
      .map((fee) => sumDecimalStrings([earnedAmount(fee), fee.vat_amount])),
  );

  const dueSoon = dueRows(
    schedules,
    reportsBySchedule,
    dealsById,
    today,
    (days) => days >= 0 && days <= 14,
  );
  const overdue = dueRows(schedules, reportsBySchedule, dealsById, today, (days) => days < 0);
  const ongoingTransactions = activeDeals
    .map((deal) => ({
      ...deal,
      days_in_stage: Math.max(0, daysBetween(today, deal.stage_entered_at)),
    }))
    .sort((a, b) => b.days_in_stage - a.days_in_stage)
    .slice(0, 8);

  const pipeline = (pipelineResult.data ?? []).map((row, index) => ({
    stage: row.stage_name,
    value: Number(row.pipeline_value ?? 0),
    count: row.deal_count ?? 0,
    color: `var(--chart-${(index % 4) + 1})`,
  }));
  const labels = monthLabels(today);
  const feesByMonth = labels.map(({ key, label }) => ({
    month: label,
    earned: Number(
      sumDecimalStrings(
        fees
          .filter(
            (fee) =>
              monthKey(fee.earned_at ?? "") === key &&
              ["earned", "received", "paid"].includes(fee.status),
          )
          .map(earnedAmount),
      ),
    ),
    received: Number(
      sumDecimalStrings(
        fees
          .filter(
            (fee) =>
              fee.id &&
              receiptDates.has(fee.id) &&
              monthKey(receiptDates.get(fee.id) ?? "") === key,
          )
          .map(earnedAmount),
      ),
    ),
  }));
  const repaymentsDue30 = Array.from({ length: 5 }, (_, index) => {
    const start = index * 7;
    const end = Math.min(30, start + 6);
    const rows = dueSoon.filter((row) => row.days_until_due >= start && row.days_until_due <= end);
    return {
      label: `${start}–${end}d`,
      amount: Number(sumDecimalStrings(rows.map((row) => row.outstanding))),
      count: rows.length,
    };
  });
  const ageingLabels = ["0–30", "31–60", "61–90", "90+"];
  const overdueAgeing = ageingLabels.map((bucket) => {
    const rows = overdue.filter(
      (row) =>
        (row.days_overdue <= 30
          ? "0–30"
          : row.days_overdue <= 60
            ? "31–60"
            : row.days_overdue <= 90
              ? "61–90"
              : "90+") === bucket,
    );
    return {
      bucket,
      amount: Number(sumDecimalStrings(rows.map((row) => row.outstanding))),
      count: rows.length,
    };
  });
  const referrerNames = new Map((referrersResult.data ?? []).map((row) => [row.id, row.name]));
  const topReferrers: ReferrerRow[] = (referrerStatsResult.data ?? []).map((row) => ({
    id: row.referrer_id,
    name: referrerNames.get(row.referrer_id) ?? "Referrer",
    deals_funded: row.deals_funded ?? 0,
    amount_funded: String(row.amount_funded ?? "0.00"),
    fees_earned: String(row.fees_earned ?? "0.00"),
  }));

  return {
    today,
    monthLabel: currentMonth.label,
    kpis: {
      activeDeals: { current: activeDeals.length, previous: activeDealsPrior.length },
      pipelineValue: { current: pipelineValue, previous: pipelineValuePrior },
      outstandingBalance: { current: outstandingBalance, previous: outstandingBalancePrior },
      overdueAmount: { current: overdueAmount, previous: overdueAmountPrior },
      feesEarnedMtd: { current: earnedMtd, previous: earnedMtdPrior },
      feesEarnedYtd: { current: earnedYtd, previous: earnedYtdPrior },
      feesReceivable: { current: receivable, previous: receivablePrior },
    },
    ongoingTransactions,
    dueSoon,
    overdue,
    pipeline,
    feesByMonth,
    repaymentsDue30,
    overdueAgeing,
    topReferrers,
  };
}

export { percentageDelta };
