"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { accountSchema, journalSchema, periodSchema } from "@/features/accounting/schemas";
import {
  expenseSchema,
  feeReceiptSchema,
  referralPaymentSchema,
} from "@/features/accounting/finance-schemas";
import { type ActionResult, friendlyDbError, issuesToFieldErrors } from "@/lib/actions";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, TablesInsert } from "@/types/database";

const idSchema = z.uuid();

export async function saveAccount(id: unknown, input: unknown): Promise<ActionResult> {
  const user = await requireRole("ceo", "accountant");
  const parsedId = id === null || id === undefined || id === "" ? null : idSchema.safeParse(id);
  const parsed = accountSchema.safeParse(input);
  if ((id !== null && id !== undefined && id !== "" && !parsedId?.success) || !parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: parsed.success ? undefined : issuesToFieldErrors(parsed.error.issues),
    };
  }
  const supabase = await createSupabaseServerClient();
  const values = { ...parsed.data, created_by: user.id } as unknown as TablesInsert<"accounts">;
  const result = parsedId?.success
    ? await supabase.from("accounts").update(values).eq("id", parsedId.data)
    : await supabase.from("accounts").insert(values);
  if (result.error) return { ok: false, error: friendlyDbError(result.error, "this account") };
  refresh();
  return { ok: true };
}

export async function postManualJournal(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireRole("ceo", "accountant");
  const parsed = journalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "The journal must balance before it can be posted.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  }
  const supabase = await createSupabaseServerClient();
  const args = {
    p_entry_date: parsed.data.entry_date,
    p_memo: parsed.data.memo,
    p_reference: parsed.data.reference ?? undefined,
    p_lines: parsed.data.lines,
    p_source: "manual",
  } as unknown as Database["public"]["Functions"]["post_journal"]["Args"];
  const { data, error } = await supabase.rpc("post_journal", args);
  if (error) return { ok: false, error: friendlyDbError(error, "this journal") };
  refresh();
  return { ok: true, data: { id: data } };
}

export async function setPeriodLock(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ceo", "accountant");
  const parsed = periodSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Choose a valid period." };
  const supabase = await createSupabaseServerClient();
  const result = parsed.data.locked
    ? await supabase.from("periods").upsert(
        {
          period: parsed.data.period,
          is_locked: true,
          locked_at: new Date().toISOString(),
          locked_by: user.id,
        },
        { onConflict: "period" },
      )
    : await supabase
        .from("periods")
        .update({ is_locked: false, locked_at: null, locked_by: null })
        .eq("period", parsed.data.period);
  if (result.error) return { ok: false, error: friendlyDbError(result.error, "this period") };
  refresh();
  return { ok: true };
}

export async function recordFeeReceipt(feeId: unknown, input: unknown): Promise<ActionResult> {
  await requireRole("ceo", "accountant");
  const id = idSchema.safeParse(feeId);
  const parsed = feeReceiptSchema.safeParse(input);
  if (!id.success || !parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: parsed.success ? undefined : issuesToFieldErrors(parsed.error.issues),
    };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("record_fee_receipt", {
    p_fee_id: id.data,
    p_received_on: parsed.data.received_on,
    p_wht_amount: parsed.data.wht_amount ? Number(parsed.data.wht_amount) : undefined,
  });
  if (error) return { ok: false, error: friendlyDbError(error, "this fee receipt") };
  refresh();
  return { ok: true };
}

export async function payReferralFee(feeId: unknown, input: unknown): Promise<ActionResult> {
  await requireRole("ceo", "accountant");
  const id = idSchema.safeParse(feeId);
  const parsed = referralPaymentSchema.safeParse(input);
  if (!id.success || !parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: parsed.success ? undefined : issuesToFieldErrors(parsed.error.issues),
    };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("pay_referral_fee", {
    p_fee_id: id.data,
    p_paid_on: parsed.data.paid_on,
  });
  if (error) return { ok: false, error: friendlyDbError(error, "this referral payment") };
  refresh();
  return { ok: true };
}

export async function postExpense(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireRole("ceo", "accountant");
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  }
  const supabase = await createSupabaseServerClient();
  const account = await supabase
    .from("accounts")
    .select("id")
    .eq("code", parsed.data.expense_account)
    .eq("type", "expense")
    .eq("is_active", true)
    .maybeSingle();
  if (account.error)
    return { ok: false, error: friendlyDbError(account.error, "this expense account") };
  if (!account.data) return { ok: false, error: "Choose an active expense account." };
  const args = {
    p_entry_date: parsed.data.entry_date,
    p_memo: parsed.data.description,
    p_reference: undefined,
    p_source: "expense",
    p_lines: [
      {
        account: parsed.data.expense_account,
        debit: parsed.data.amount,
        description: parsed.data.description,
      },
      { account: "1000", credit: parsed.data.amount, description: "Paid from bank" },
    ],
  } as unknown as Database["public"]["Functions"]["post_journal"]["Args"];
  const { data, error } = await supabase.rpc("post_journal", args);
  if (error) return { ok: false, error: friendlyDbError(error, "this expense") };
  refresh();
  return { ok: true, data: { id: data } };
}
