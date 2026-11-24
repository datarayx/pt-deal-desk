import "server-only";

import { notFound } from "next/navigation";
import { z } from "zod";

import { dealAmount, type FinancierDealRow } from "@/features/financiers/queries";
import type { ReferrerType } from "@/features/referrers/schemas";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

export type ReferrerStats = {
  clients_referred: number;
  deal_count: number;
  deals_funded: number;
  amount_funded: string;
  fees_earned: string;
  fees_paid: string;
  fees_payable: string;
  fees_pending_count: number;
};

export type ReferrerListRow = ReferrerStats & {
  id: string;
  name: string;
  referrer_type: ReferrerType;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  default_fee_type: "percent" | "flat" | null;
  default_fee_value: string | null;
};

const emptyStats: ReferrerStats = {
  clients_referred: 0,
  deal_count: 0,
  deals_funded: 0,
  amount_funded: "0",
  fees_earned: "0",
  fees_paid: "0",
  fees_payable: "0",
  fees_pending_count: 0,
};

const REFERRER_COLUMNS =
  "id, name, referrer_type, contact_person, phone, email, default_fee_type, default_fee_value::text";

function statsOf(
  s: Partial<Record<keyof ReferrerStats, unknown>> | undefined | null,
): ReferrerStats {
  if (!s) return emptyStats;
  return {
    clients_referred: Number(s.clients_referred ?? 0),
    deal_count: Number(s.deal_count ?? 0),
    deals_funded: Number(s.deals_funded ?? 0),
    amount_funded: String(s.amount_funded ?? "0"),
    fees_earned: String(s.fees_earned ?? "0"),
    fees_paid: String(s.fees_paid ?? "0"),
    fees_payable: String(s.fees_payable ?? "0"),
    fees_pending_count: Number(s.fees_pending_count ?? 0),
  };
}

export async function getReferrers(): Promise<ReferrerListRow[]> {
  await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const [referrers, stats] = await Promise.all([
    supabase.from("referrers").select(REFERRER_COLUMNS).order("name"),
    supabase.from("v_referrer_stats").select("*"),
  ]);
  if (referrers.error) throw new Error(referrers.error.message);
  if (stats.error) throw new Error(stats.error.message);
  const byId = new Map(stats.data.map((s) => [s.referrer_id, s]));
  return referrers.data.map((r) => ({ ...r, ...statsOf(byId.get(r.id)) }));
}

export type ReferrerDetail = ReferrerListRow & {
  bank_name: string | null;
  account_name: string | null;
  created_at: string;
};

export type ReferredClientRow = {
  id: string;
  display_name: string;
  client_type: Enums["client_type"];
  sector: string | null;
  kyc_status: Enums["kyc_status"];
  created_at: string;
};

export type ReferralFee = {
  basis: Enums["fee_basis"];
  value: string;
  computed_amount: string | null;
  status: Enums["fee_status"];
  earned_at: string | null;
};

export type ReferrerDealRow = FinancierDealRow & {
  financier_name: string | null;
  referral_fee: ReferralFee | null;
};

export async function getReferrer(referrerId: string) {
  await requireRole("ceo");
  const id = z.uuid().safeParse(referrerId);
  if (!id.success) notFound();
  const supabase = await createSupabaseServerClient();
  const [referrer, stats, clients, deals] = await Promise.all([
    supabase
      .from("referrers")
      .select(`${REFERRER_COLUMNS}, bank_name, account_name, created_at`)
      .eq("id", id.data)
      .maybeSingle(),
    supabase.from("v_referrer_stats").select("*").eq("referrer_id", id.data).maybeSingle(),
    supabase
      .from("clients")
      .select("id, display_name, client_type, sector, kyc_status, created_at")
      .eq("referrer_id", id.data)
      .order("display_name"),
    supabase
      .from("deals")
      .select(
        "id, reference, client_id, outcome, amount_requested::text, amount_approved::text, amount_disbursed::text, disbursement_date, created_at, clients(display_name), financiers(name), facility_types(name), deal_stages!deals_stage_id_fkey(name, color), deal_fees(fee_kind, basis, value::text, computed_amount::text, status, earned_at)",
      )
      .eq("referrer_id", id.data)
      .eq("deal_fees.fee_kind", "referral_fee")
      .neq("deal_fees.status", "cancelled")
      .order("created_at", { ascending: false }),
  ]);
  for (const r of [referrer, stats, clients, deals]) if (r.error) throw new Error(r.error.message);
  const r = referrer.data;
  if (!r) notFound();

  const detail: ReferrerDetail = { ...r, ...statsOf(stats.data) };

  const dealRows: ReferrerDealRow[] = (deals.data ?? []).map((d) => {
    const fee = d.deal_fees[0];
    return {
      id: d.id,
      reference: d.reference,
      client_id: d.client_id,
      client_name: d.clients?.display_name ?? "—",
      financier_name: d.financiers?.name ?? null,
      facility_type: d.facility_types?.name ?? null,
      stage_name: d.deal_stages?.name ?? "—",
      stage_color: d.deal_stages?.color ?? null,
      outcome: d.outcome,
      disbursement_date: d.disbursement_date,
      created_at: d.created_at,
      ...dealAmount(d),
      referral_fee: fee
        ? {
            basis: fee.basis,
            value: fee.value,
            computed_amount: fee.computed_amount,
            status: fee.status,
            earned_at: fee.earned_at,
          }
        : null,
    };
  });

  return {
    referrer: detail,
    clients: (clients.data ?? []) as ReferredClientRow[],
    deals: dealRows,
  };
}
