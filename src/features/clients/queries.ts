import "server-only";

import { notFound } from "next/navigation";
import { z } from "zod";

import type { ClientType, CompanyType, EnquirySource } from "@/features/clients/options";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Tables } from "@/types/database";

type Enums = Database["public"]["Enums"];

/** One row of the Clients list. BVN/NIN arrive already masked from v_client_list. */
export type ClientListRow = {
  id: string;
  client_type: ClientType;
  display_name: string;
  sector: string | null;
  kyc_status: Enums["kyc_status"];
  enquiry_source: EnquirySource;
  created_at: string;
  referrer_id: string | null;
  referrer_name: string | null;
  phone: string | null;
  email: string | null;
  rc_number: string | null;
  company_type: CompanyType | null;
  bvn_masked: string | null;
  nin_masked: string | null;
  director_count: number;
  required_docs: number;
  received_docs: number;
  latest_bureau: Enums["credit_bureau"] | null;
  latest_rating: string | null;
  latest_check_date: string | null;
  active_deals: number;
  deal_count: number;
  outstanding: string;
  reliability_badge: keyof typeof reliabilityBadge;
  on_time_percent: number | null;
  average_days_late: number | null;
  current_overdue_amount: string;
  default_count: number;
  max_overdue_days: number;
  external_exposure: string;
};

export async function getClients(): Promise<ClientListRow[]> {
  await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const [clientsResult, reliabilityResult] = await Promise.all([
    supabase.from("v_client_list").select("*").order("display_name"),
    supabase.from("v_client_reliability").select("*"),
  ]);
  if (clientsResult.error) throw new Error(clientsResult.error.message);
  if (reliabilityResult.error) throw new Error(reliabilityResult.error.message);
  const reliability = new Map((reliabilityResult.data ?? []).map((row) => [row.client_id, row]));
  return clientsResult.data.map((r) => {
    const score = reliability.get(r.id);
    return {
      id: r.id ?? "",
      client_type: (r.client_type ?? "company") as ClientType,
      display_name: r.display_name ?? "",
      sector: r.sector,
      kyc_status: r.kyc_status ?? "incomplete",
      enquiry_source: (r.enquiry_source ?? "email") as EnquirySource,
      created_at: r.created_at ?? "",
      referrer_id: r.referrer_id,
      referrer_name: r.referrer_name,
      phone: r.phone,
      email: r.email,
      rc_number: r.rc_number,
      company_type: r.company_type,
      bvn_masked: r.bvn_masked,
      nin_masked: r.nin_masked,
      director_count: r.director_count ?? 0,
      required_docs: r.required_docs ?? 0,
      received_docs: r.received_docs ?? 0,
      latest_bureau: r.latest_bureau,
      latest_rating: r.latest_rating,
      latest_check_date: r.latest_check_date,
      active_deals: r.active_deals ?? 0,
      deal_count: r.deal_count ?? 0,
      outstanding: score ? String(score.outstanding_amount ?? "0.00") : (r.outstanding ?? "0.00"),
      reliability_badge: (score?.reliability_badge ?? "watch") as keyof typeof reliabilityBadge,
      on_time_percent: score?.on_time_percent ?? null,
      average_days_late: score?.average_days_late ?? null,
      current_overdue_amount: String(score?.current_overdue_amount ?? "0.00"),
      default_count: score?.default_count ?? 0,
      max_overdue_days: score?.max_overdue_days ?? 0,
      external_exposure: String(score?.external_exposure ?? "0.00"),
    };
  });
}

export type KycChecklistItem = {
  id: string;
  client_type: ClientType;
  name: string;
  is_required: boolean;
  has_expiry: boolean;
};

/** What the New Client wizard needs: referrers and the KYC checklists. */
export async function getNewClientOptions() {
  await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const [referrers, docTypes] = await Promise.all([
    supabase.from("referrers").select("id, name").order("name"),
    supabase
      .from("kyc_document_types")
      .select("id, client_type, name, is_required, has_expiry")
      .order("client_type")
      .order("sort_order"),
  ]);
  if (referrers.error) throw new Error(referrers.error.message);
  if (docTypes.error) throw new Error(docTypes.error.message);
  return { referrers: referrers.data, checklist: docTypes.data as KycChecklistItem[] };
}

export type Client360Document = {
  id: string;
  document_type_id: string;
  type_name: string;
  is_required: boolean;
  has_expiry: boolean;
  individual_profile_id: string | null;
  person_name: string;
  file_path: string | null;
  status: Enums["document_status"];
  expiry_date: string | null;
  verified_at: string | null;
};

export type Client360Director = Tables<"company_directors"> & {
  profile: Tables<"individual_profiles">;
};

export type Client360Deal = {
  id: string;
  reference: string;
  outcome: Enums["deal_outcome"];
  stage_name: string;
  stage_color: string | null;
  financier_name: string | null;
  facility_type: string | null;
  amount_requested: string | null;
  amount_approved: string | null;
  amount_disbursed: string | null;
  interest_rate_monthly: string | null;
  tenor_months: number | null;
  disbursement_date: string | null;
  first_repayment_date: string | null;
  maturity_date: string | null;
  repayment_frequency: Enums["repayment_frequency"] | null;
  stage_entered_at: string;
  created_at: string;
};

export type Client360Schedule = {
  id: string;
  deal_id: string;
  instalment_no: number;
  due_date: string;
  principal_due: string;
  interest_due: string;
  total_due: string;
  status: Enums["instalment_status"];
  days_overdue: number;
};

export type Client360Report = Omit<Tables<"repayment_reports">, "amount"> & { amount: string };

export type Client360Reliability = {
  badge: keyof typeof reliabilityBadge;
  on_time_percent: number | null;
  average_days_late: number | null;
  overdue_count: number;
  default_count: number;
  outstanding: string;
  current_overdue_amount: string;
  max_overdue_days: number;
  external_exposure: string;
  latest_bureau: Enums["credit_bureau"] | null;
  latest_rating: string | null;
};

export type Client360Activity = Tables<"activities">;

export type Client360 = {
  client: Tables<"clients">;
  summary: ClientListRow;
  individualProfile: Tables<"individual_profiles"> | null;
  companyProfile: Tables<"company_profiles"> | null;
  directors: Client360Director[];
  documents: Client360Document[];
  creditChecks: Tables<"credit_checks">[];
  exposures: Tables<"external_exposures">[];
  deals: Client360Deal[];
  schedules: Client360Schedule[];
  reports: Client360Report[];
  activities: Client360Activity[];
  reliability: Client360Reliability;
};

export const reliabilityBadge = {
  good: { label: "Good", tone: "success" as const },
  watch: { label: "Watch", tone: "warning" as const },
  high_risk: { label: "High risk", tone: "danger" as const },
};

function dateDifference(later: string, earlier: string) {
  const toUtc = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1);
  };
  return Math.round((toUtc(later) - toUtc(earlier)) / 86_400_000);
}

function calculateReliability(
  deals: Client360Deal[],
  schedules: Client360Schedule[],
  reports: Client360Report[],
  outstanding: string,
): Client360Reliability {
  const reportsBySchedule = new Map<string, Client360Report[]>();
  for (const report of reports) {
    const current = reportsBySchedule.get(report.schedule_id) ?? [];
    current.push(report);
    reportsBySchedule.set(report.schedule_id, current);
  }
  let paidCount = 0;
  let onTimeCount = 0;
  let totalDaysLate = 0;
  for (const schedule of schedules) {
    const scheduleReports = reportsBySchedule.get(schedule.id) ?? [];
    const paidOn = scheduleReports.map((report) => report.paid_on).sort()[0];
    if (!paidOn) continue;
    const daysLate = Math.max(0, dateDifference(paidOn, schedule.due_date));
    paidCount += 1;
    totalDaysLate += daysLate;
    if (daysLate <= 3) onTimeCount += 1;
  }
  const onTimePercent = paidCount === 0 ? null : Math.round((onTimeCount / paidCount) * 100);
  const overdue = schedules.filter(
    (schedule) => schedule.status === "overdue" || schedule.days_overdue > 0,
  );
  const maxOverdue = Math.max(0, ...overdue.map((schedule) => schedule.days_overdue));
  const defaultCount = deals.filter((deal) => deal.outcome === "defaulted").length;
  const badge =
    defaultCount > 0 || maxOverdue > 30 || (onTimePercent !== null && onTimePercent < 70)
      ? "high_risk"
      : onTimePercent !== null && onTimePercent >= 90 && overdue.length === 0
        ? "good"
        : "watch";
  return {
    badge,
    on_time_percent: onTimePercent,
    average_days_late: paidCount === 0 ? null : Math.round(totalDaysLate / paidCount),
    overdue_count: overdue.length,
    default_count: defaultCount,
    outstanding,
    current_overdue_amount: "0.00",
    max_overdue_days: maxOverdue,
    external_exposure: "0.00",
    latest_bureau: null,
    latest_rating: null,
  };
}

export async function getClient360(clientId: string): Promise<Client360> {
  await requireRole("ceo");
  const parsedId = z.uuid().safeParse(clientId);
  if (!parsedId.success) notFound();
  const id = parsedId.data;
  const supabase = await createSupabaseServerClient();
  const [clientResult, summaryResult] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase.from("v_client_list").select("*").eq("id", id).maybeSingle(),
  ]);
  if (clientResult.error) throw new Error(clientResult.error.message);
  if (summaryResult.error) throw new Error(summaryResult.error.message);
  if (!clientResult.data || !summaryResult.data) notFound();
  const reliabilityResult = await supabase
    .from("v_client_reliability")
    .select("*")
    .eq("client_id", id)
    .maybeSingle();
  if (reliabilityResult.error) throw new Error(reliabilityResult.error.message);
  const score = reliabilityResult.data;
  const client = clientResult.data;
  const summary = {
    id: summaryResult.data.id,
    client_type: summaryResult.data.client_type,
    display_name: summaryResult.data.display_name,
    sector: summaryResult.data.sector,
    kyc_status: summaryResult.data.kyc_status,
    enquiry_source: summaryResult.data.enquiry_source,
    created_at: summaryResult.data.created_at,
    referrer_id: summaryResult.data.referrer_id,
    referrer_name: summaryResult.data.referrer_name,
    phone: summaryResult.data.phone,
    email: summaryResult.data.email,
    rc_number: summaryResult.data.rc_number,
    company_type: summaryResult.data.company_type,
    bvn_masked: summaryResult.data.bvn_masked,
    nin_masked: summaryResult.data.nin_masked,
    director_count: summaryResult.data.director_count ?? 0,
    required_docs: summaryResult.data.required_docs ?? 0,
    received_docs: summaryResult.data.received_docs ?? 0,
    latest_bureau: summaryResult.data.latest_bureau,
    latest_rating: summaryResult.data.latest_rating,
    latest_check_date: summaryResult.data.latest_check_date,
    active_deals: summaryResult.data.active_deals ?? 0,
    deal_count: summaryResult.data.deal_count ?? 0,
    outstanding: String(score?.outstanding_amount ?? summaryResult.data.outstanding ?? "0.00"),
    reliability_badge: (score?.reliability_badge ?? "watch") as keyof typeof reliabilityBadge,
    on_time_percent: score?.on_time_percent ?? null,
    average_days_late: score?.average_days_late ?? null,
    current_overdue_amount: String(score?.current_overdue_amount ?? "0.00"),
    default_count: score?.default_count ?? 0,
    max_overdue_days: score?.max_overdue_days ?? 0,
    external_exposure: String(score?.external_exposure ?? "0.00"),
  } satisfies ClientListRow;

  const [
    individualResult,
    companyResult,
    directorResult,
    docTypeResult,
    documentResult,
    creditResult,
    exposureResult,
    dealsResult,
    activityResult,
  ] = await Promise.all([
    supabase.from("individual_profiles").select("*").eq("client_id", id).maybeSingle(),
    supabase.from("company_profiles").select("*").eq("client_id", id).maybeSingle(),
    supabase.from("company_directors").select("*").eq("company_client_id", id).order("created_at"),
    supabase
      .from("kyc_document_types")
      .select("id, client_type, name, is_required, has_expiry, sort_order")
      .order("client_type")
      .order("sort_order"),
    supabase.from("client_documents").select("*").eq("client_id", id).order("created_at"),
    supabase
      .from("credit_checks")
      .select("*")
      .eq("client_id", id)
      .order("check_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("external_exposures")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("deals")
      .select(
        "id, reference, outcome, stage_id, amount_requested::text, amount_approved::text, amount_disbursed::text, interest_rate_monthly::text, tenor_months, disbursement_date, first_repayment_date, maturity_date, repayment_frequency, stage_entered_at, created_at, financier_id, facility_type_id",
      )
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("activities")
      .select("*")
      .eq("entity_type", "client")
      .eq("entity_id", id)
      .order("occurred_at", { ascending: false }),
  ]);
  for (const result of [
    individualResult,
    companyResult,
    directorResult,
    docTypeResult,
    documentResult,
    creditResult,
    exposureResult,
    dealsResult,
    activityResult,
  ]) {
    if (result.error) throw new Error(result.error.message);
  }

  const directorsData = directorResult.data ?? [];
  const docTypesData = docTypeResult.data ?? [];
  const documentsData = documentResult.data ?? [];
  const creditChecksData = creditResult.data ?? [];
  const exposuresData = exposureResult.data ?? [];
  const dealsData = dealsResult.data ?? [];
  const activitiesData = activityResult.data ?? [];
  const directorIds = directorsData.map((director) => director.individual_profile_id);
  const profileResult = directorIds.length
    ? await supabase.from("individual_profiles").select("*").in("id", directorIds)
    : { data: [], error: null };
  if (profileResult.error) throw new Error(profileResult.error.message);
  const profiles = new Map(profileResult.data.map((profile) => [profile.id, profile]));
  const directors = directorsData.flatMap((director) => {
    const profile = profiles.get(director.individual_profile_id);
    return profile ? [{ ...director, profile }] : [];
  });

  const stageIds = [...new Set(dealsData.map((deal) => deal.stage_id))];
  const financierIds = [
    ...new Set(dealsData.map((deal) => deal.financier_id).filter(Boolean)),
  ] as string[];
  const facilityIds = [
    ...new Set(dealsData.map((deal) => deal.facility_type_id).filter(Boolean)),
  ] as string[];
  const [stageResult, financierResult, facilityResult] = await Promise.all([
    stageIds.length
      ? supabase.from("deal_stages").select("id, name, color").in("id", stageIds)
      : Promise.resolve({ data: [], error: null }),
    financierIds.length
      ? supabase.from("financiers").select("id, name").in("id", financierIds)
      : Promise.resolve({ data: [], error: null }),
    facilityIds.length
      ? supabase.from("facility_types").select("id, name").in("id", facilityIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  for (const result of [stageResult, financierResult, facilityResult]) {
    if (result.error) throw new Error(result.error.message);
  }
  const stages = new Map((stageResult.data ?? []).map((stage) => [stage.id, stage]));
  const financiers = new Map(
    (financierResult.data ?? []).map((financier) => [financier.id, financier.name]),
  );
  const facilities = new Map(
    (facilityResult.data ?? []).map((facility) => [facility.id, facility.name]),
  );
  const deals: Client360Deal[] = dealsData.map((deal) => ({
    id: deal.id,
    reference: deal.reference,
    outcome: deal.outcome,
    stage_name: stages.get(deal.stage_id)?.name ?? "Unknown stage",
    stage_color: stages.get(deal.stage_id)?.color ?? null,
    financier_name: deal.financier_id ? (financiers.get(deal.financier_id) ?? null) : null,
    facility_type: deal.facility_type_id ? (facilities.get(deal.facility_type_id) ?? null) : null,
    amount_requested: deal.amount_requested,
    amount_approved: deal.amount_approved,
    amount_disbursed: deal.amount_disbursed,
    interest_rate_monthly: deal.interest_rate_monthly,
    tenor_months: deal.tenor_months,
    disbursement_date: deal.disbursement_date,
    first_repayment_date: deal.first_repayment_date,
    maturity_date: deal.maturity_date,
    repayment_frequency: deal.repayment_frequency,
    stage_entered_at: deal.stage_entered_at,
    created_at: deal.created_at,
  }));

  const dealIds = deals.map((deal) => deal.id);
  const schedulesResult = dealIds.length
    ? await supabase
        .from("repayment_schedules")
        .select(
          "id, deal_id, instalment_no, due_date, principal_due::text, interest_due::text, total_due::text, status, days_overdue",
        )
        .in("deal_id", dealIds)
        .order("due_date")
    : { data: [], error: null };
  if (schedulesResult.error) throw new Error(schedulesResult.error.message);
  const schedulesData = schedulesResult.data ?? [];
  const scheduleIds = schedulesData.map((schedule) => schedule.id);
  const reportsResult = scheduleIds.length
    ? await supabase
        .from("repayment_reports")
        .select(
          "id, schedule_id, amount::text, paid_on, channel, proof_file_path, reported_at, confirmed_by_financier, confirmed_at, confirmation_note, created_at, updated_at, created_by",
        )
        .in("schedule_id", scheduleIds)
        .order("paid_on")
    : { data: [], error: null };
  if (reportsResult.error) throw new Error(reportsResult.error.message);

  const documentsByType = new Map(docTypesData.map((type) => [type.id, type]));
  const profileNames = new Map<string, string>();
  if (individualResult.data)
    profileNames.set(
      individualResult.data.id,
      `${individualResult.data.first_name} ${individualResult.data.last_name}`,
    );
  for (const director of directors)
    profileNames.set(
      director.profile.id,
      `${director.profile.first_name} ${director.profile.last_name}`,
    );
  const documents: Client360Document[] = documentsData.flatMap((document) => {
    const type = documentsByType.get(document.document_type_id);
    if (!type) return [];
    return [
      {
        id: document.id,
        document_type_id: document.document_type_id,
        type_name: type.name,
        is_required: type.is_required,
        has_expiry: type.has_expiry,
        individual_profile_id: document.individual_profile_id,
        person_name: document.individual_profile_id
          ? (profileNames.get(document.individual_profile_id) ?? "Director")
          : client.client_type === "company"
            ? "Company"
            : client.display_name,
        file_path: document.file_path,
        status: document.status,
        expiry_date: document.expiry_date,
        verified_at: document.verified_at,
      },
    ];
  });

  const schedules: Client360Schedule[] = schedulesData.map((schedule) => ({
    id: schedule.id,
    deal_id: schedule.deal_id,
    instalment_no: schedule.instalment_no,
    due_date: schedule.due_date,
    principal_due: schedule.principal_due,
    interest_due: schedule.interest_due,
    total_due: schedule.total_due,
    status: schedule.status,
    days_overdue: schedule.days_overdue,
  }));
  const reports: Client360Report[] = (reportsResult.data ?? []).map((report) => ({
    ...report,
    amount: report.amount,
  }));
  return {
    client,
    summary,
    individualProfile: individualResult.data,
    companyProfile: companyResult.data,
    directors,
    documents,
    creditChecks: creditChecksData,
    exposures: exposuresData,
    deals,
    schedules,
    reports,
    activities: activitiesData,
    reliability: score
      ? {
          badge: score.reliability_badge as keyof typeof reliabilityBadge,
          on_time_percent: score.on_time_percent,
          average_days_late: score.average_days_late,
          overdue_count: score.overdue_count,
          default_count: score.default_count,
          outstanding: String(score.outstanding_amount ?? "0.00"),
          current_overdue_amount: String(score.current_overdue_amount ?? "0.00"),
          max_overdue_days: score.max_overdue_days,
          external_exposure: String(score.external_exposure ?? "0.00"),
          latest_bureau: score.latest_bureau,
          latest_rating: score.latest_rating,
        }
      : calculateReliability(deals, schedules, reports, summary.outstanding),
  };
}
