"use server";

import { refresh } from "next/cache";

import {
  companyProfileSchema,
  feeDefaultsSchema,
  LOGO_MAX_BYTES,
  LOGO_TYPES,
  reminderSettingsSchema,
} from "@/features/settings/schemas";
import { companyValues } from "@/features/settings/settings-values";
import { type ActionResult, friendlyDbError, issuesToFieldErrors } from "@/lib/actions";
import { requireRole } from "@/lib/auth/session";
import type { Json } from "@/types/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function upsertSettings(values: Record<string, NonNullable<Json>>): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("settings").upsert(
    Object.entries(values).map(([key, value]) => ({ key, value })),
    { onConflict: "key" },
  );
  if (error) return { ok: false, error: friendlyDbError(error, "these settings") };
  refresh();
  return { ok: true };
}

export async function saveReminderSettings(input: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const parsed = reminderSettingsSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Check the form.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  return upsertSettings({
    reminder_days_before_due: parsed.data.reminder_days_before_due,
    overdue_email_weekdays: parsed.data.overdue_email_weekdays,
    stale_deal_days: Number(parsed.data.stale_deal_days),
  });
}

export async function saveFeeDefaults(input: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const parsed = feeDefaultsSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Check the form.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  const v = parsed.data;
  return upsertSettings({
    vat_rate_pct: Number(v.vat_rate_pct),
    wht_rate_pct: Number(v.wht_rate_pct),
    referral_fee_trigger: v.referral_fee_trigger,
    fee_defaults: {
      client_fee_pct: Number(v.client_fee_pct),
      provider_commission_pct: Number(v.provider_commission_pct),
      collateral_fee: {
        basis: v.collateral_fee_basis,
        // Flat amounts are money: kept as an exact decimal string
        value:
          v.collateral_fee_basis === "percent"
            ? Number(v.collateral_fee_value)
            : v.collateral_fee_value.replace(/[₦,\s]/g, ""),
      },
    },
  });
}

async function currentCompanyProfile() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "company_profile")
    .maybeSingle();
  return companyValues.parse(data?.value ?? {});
}

export async function saveCompanyProfile(input: unknown): Promise<ActionResult> {
  await requireRole("ceo");
  const parsed = companyProfileSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Check the form.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  const current = await currentCompanyProfile();
  return upsertSettings({
    company_profile: { ...parsed.data, logo_path: current.logo_path ?? null },
  });
}

/** Logo upload: PNG/JPEG/WebP up to 1 MB into the private branding bucket. */
export async function uploadCompanyLogo(formData: FormData): Promise<ActionResult> {
  await requireRole("ceo");
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Choose an image to upload." };
  if (!(LOGO_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Use a PNG, JPEG or WebP image." };
  }
  if (file.size > LOGO_MAX_BYTES) return { ok: false, error: "The logo must be 1 MB or smaller." };

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `company/logo-${Date.now()}.${ext}`;
  const supabase = await createSupabaseServerClient();
  const { error: uploadError } = await supabase.storage
    .from("branding")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, error: "The logo couldn't be uploaded. Try again." };

  const current = await currentCompanyProfile();
  const saved = await upsertSettings({ company_profile: { ...current, logo_path: path } });
  if (saved.ok && current.logo_path) {
    await supabase.storage.from("branding").remove([current.logo_path]);
  }
  return saved;
}

export async function removeCompanyLogo(): Promise<ActionResult> {
  await requireRole("ceo");
  const current = await currentCompanyProfile();
  if (!current.logo_path) return { ok: true };
  const saved = await upsertSettings({ company_profile: { ...current, logo_path: null } });
  if (saved.ok) {
    const supabase = await createSupabaseServerClient();
    await supabase.storage.from("branding").remove([current.logo_path]);
  }
  return saved;
}
