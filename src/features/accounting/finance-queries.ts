import "server-only";

import { requireRole } from "@/lib/auth/session";
import { addDecimalStrings } from "@/lib/money/decimal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

export type FinanceFeeRow = {
  fee_id: string;
  deal_id: string;
  deal_reference: string;
  client_name: string;
  fee_kind: Enums["fee_kind"];
  basis: Enums["fee_basis"];
  value: string;
  base_amount: string | null;
  computed_amount: string | null;
  vat_amount: string;
  wht_amount: string;
  status: Enums["fee_status"];
  trigger: Enums["fee_trigger"];
  earned_at: string | null;
  journal_entry_id: string | null;
  amount_due: string;
};

async function getFinanceFees(): Promise<FinanceFeeRow[]> {
  await requireRole("ceo", "accountant");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("fee_lines_finance");
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((fee) => {
    if (
      !fee.fee_id ||
      !fee.deal_id ||
      !fee.deal_reference ||
      !fee.client_name ||
      !fee.fee_kind ||
      !fee.basis ||
      !fee.status ||
      !fee.trigger
    )
      return [];
    const computed = fee.computed_amount === null ? null : String(fee.computed_amount);
    const vat = String(fee.vat_amount ?? 0);
    return [
      {
        fee_id: fee.fee_id,
        deal_id: fee.deal_id,
        deal_reference: fee.deal_reference,
        client_name: fee.client_name,
        fee_kind: fee.fee_kind,
        basis: fee.basis,
        value: String(fee.value ?? 0),
        base_amount: fee.base_amount === null ? null : String(fee.base_amount),
        computed_amount: computed,
        vat_amount: vat,
        wht_amount: String(fee.wht_amount ?? 0),
        status: fee.status,
        trigger: fee.trigger,
        earned_at: fee.earned_at,
        journal_entry_id: fee.journal_entry_id,
        amount_due: computed ? addDecimalStrings(computed, vat) : "0.00",
      },
    ];
  });
}

export async function getReceivablesPageData() {
  const fees = await getFinanceFees();
  return fees.filter((fee) => fee.fee_kind !== "referral_fee" && fee.status !== "cancelled");
}

export async function getPayablesPageData() {
  const fees = await getFinanceFees();
  return fees.filter((fee) => fee.fee_kind === "referral_fee" && fee.status !== "cancelled");
}
