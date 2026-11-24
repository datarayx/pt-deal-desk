import "server-only";

import { requireRole } from "@/lib/auth/session";
import { subtractDecimalStrings, sumDecimalStrings } from "@/lib/money/decimal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

export type RepaymentReportRow = {
  id: string;
  schedule_id: string;
  deal_id: string;
  reference: string;
  client_name: string;
  instalment_no: number;
  due_date: string;
  schedule_total: string;
  schedule_status: Enums["instalment_status"];
  amount: string;
  paid_on: string;
  channel: Enums["payment_channel"];
  proof_file_path: string | null;
  reported_at: string;
  confirmed_by_financier: boolean;
  confirmed_at: string | null;
  confirmation_note: string | null;
};

export type RepaymentScheduleRow = {
  id: string;
  deal_id: string;
  reference: string;
  client_name: string;
  financier_name: string | null;
  instalment_no: number;
  due_date: string;
  principal_due: string;
  interest_due: string;
  total_due: string;
  paid_total: string;
  outstanding: string;
  status: Enums["instalment_status"];
  days_overdue: number;
  report_count: number;
};

export type RepaymentDealOption = {
  id: string;
  reference: string;
  client_name: string;
  outstanding: string;
};

export type RepaymentsPageData = {
  schedules: RepaymentScheduleRow[];
  reports: RepaymentReportRow[];
  dealOptions: RepaymentDealOption[];
};

export async function getRepaymentsPageData(): Promise<RepaymentsPageData> {
  await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const schedulesResult = await supabase
    .from("repayment_schedules")
    .select(
      "id, deal_id, instalment_no, due_date, principal_due::text, interest_due::text, total_due::text, status, days_overdue, deals(reference, clients(display_name), financiers(name))",
    )
    .order("due_date")
    .order("instalment_no");
  if (schedulesResult.error) throw new Error(schedulesResult.error.message);
  const scheduleData = schedulesResult.data ?? [];
  const scheduleIds = scheduleData.map((schedule) => schedule.id);
  const reportsResult = scheduleIds.length
    ? await supabase
        .from("repayment_reports")
        .select(
          "id, schedule_id, amount::text, paid_on, channel, proof_file_path, reported_at, confirmed_by_financier, confirmed_at, confirmation_note",
        )
        .in("schedule_id", scheduleIds)
        .order("reported_at", { ascending: false })
    : { data: [], error: null };
  if (reportsResult.error) throw new Error(reportsResult.error.message);

  const reportsBySchedule = new Map<string, typeof reportsResult.data>();
  for (const report of reportsResult.data ?? []) {
    const list = reportsBySchedule.get(report.schedule_id) ?? [];
    list.push(report);
    reportsBySchedule.set(report.schedule_id, list);
  }

  const schedules: RepaymentScheduleRow[] = scheduleData.map((schedule) => {
    const reports = reportsBySchedule.get(schedule.id) ?? [];
    const paidTotal = sumDecimalStrings(reports.map((report) => report.amount));
    return {
      id: schedule.id,
      deal_id: schedule.deal_id,
      reference: schedule.deals?.reference ?? "Unknown deal",
      client_name: schedule.deals?.clients?.display_name ?? "Unknown client",
      financier_name: schedule.deals?.financiers?.name ?? null,
      instalment_no: schedule.instalment_no,
      due_date: schedule.due_date,
      principal_due: schedule.principal_due,
      interest_due: schedule.interest_due,
      total_due: schedule.total_due,
      paid_total: paidTotal,
      outstanding: subtractDecimalStrings(schedule.total_due, paidTotal),
      status: schedule.status,
      days_overdue: schedule.days_overdue,
      report_count: reports.length,
    };
  });

  const scheduleById = new Map(schedules.map((schedule) => [schedule.id, schedule]));
  const reports: RepaymentReportRow[] = (reportsResult.data ?? []).flatMap((report) => {
    const schedule = scheduleById.get(report.schedule_id);
    if (!schedule) return [];
    return [
      {
        id: report.id,
        schedule_id: report.schedule_id,
        deal_id: schedule.deal_id,
        reference: schedule.reference,
        client_name: schedule.client_name,
        instalment_no: schedule.instalment_no,
        due_date: schedule.due_date,
        schedule_total: schedule.total_due,
        schedule_status: schedule.status,
        amount: report.amount,
        paid_on: report.paid_on,
        channel: report.channel,
        proof_file_path: report.proof_file_path,
        reported_at: report.reported_at,
        confirmed_by_financier: report.confirmed_by_financier,
        confirmed_at: report.confirmed_at,
        confirmation_note: report.confirmation_note,
      },
    ];
  });

  const dealMap = new Map<string, RepaymentDealOption>();
  for (const schedule of schedules) {
    if (!dealMap.has(schedule.deal_id)) {
      dealMap.set(schedule.deal_id, {
        id: schedule.deal_id,
        reference: schedule.reference,
        client_name: schedule.client_name,
        outstanding: "0.00",
      });
    }
    const deal = dealMap.get(schedule.deal_id);
    if (deal) deal.outstanding = sumDecimalStrings([deal.outstanding, schedule.outstanding]);
  }

  return { schedules, reports, dealOptions: [...dealMap.values()] };
}
