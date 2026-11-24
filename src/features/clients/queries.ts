import "server-only";

import type { ClientType, CompanyType, EnquirySource } from "@/features/clients/options";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

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
};

export async function getClients(): Promise<ClientListRow[]> {
  await requireRole("ceo");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("v_client_list").select("*").order("display_name");
  if (error) throw new Error(error.message);
  return data.map((r) => ({
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
    outstanding: r.outstanding ?? "0.00",
  }));
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
