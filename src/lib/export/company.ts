import "server-only";

import { companyValues } from "@/features/settings/settings-values";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ExportCompany } from "@/lib/export/types";

function mimeTypeForPath(path: string) {
  const extension = path.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  return "image/png";
}

async function logoDataUrl(path: string | null | undefined) {
  if (!path) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage.from("branding").download(path);
  if (error || !data) return null;

  const bytes = Buffer.from(await data.arrayBuffer());
  const mimeType =
    data.type === "image/png" || data.type === "image/jpeg" || data.type === "image/webp"
      ? data.type
      : mimeTypeForPath(path);
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

export async function getExportCompanyProfile(): Promise<ExportCompany> {
  await requireRole("ceo", "accountant");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "company_profile")
    .maybeSingle();

  if (error) throw new Error(error.message);
  const values = companyValues.parse(data?.value ?? {});

  return {
    companyName: values.name,
    companyAddress: values.address ?? null,
    companyEmail: values.email ?? null,
    companyPhone: values.phone ?? null,
    companyWebsite: values.website ?? null,
    companyRcNumber: values.rc_number ?? null,
    companyTin: values.tin ?? null,
    companyLogoDataUrl: await logoDataUrl(values.logo_path),
  };
}

