"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const CREDIT_REPORT_BUCKET = "credit-reports";
export const CREDIT_REPORT_MAX_BYTES = 10 * 1024 * 1024;
const EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export const CREDIT_REPORT_ACCEPT = Object.keys(EXT).join(",");

export function checkCreditReportFile(file: File): string | null {
  if (!EXT[file.type]) return "Use a PDF, JPEG or PNG file.";
  if (file.size > CREDIT_REPORT_MAX_BYTES) return "Files must be 10 MB or smaller.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

export async function uploadCreditReport(
  clientId: string,
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const problem = checkCreditReportFile(file);
  if (problem) return { ok: false, error: problem };
  const path = `${clientId}/${crypto.randomUUID()}.${EXT[file.type]}`;
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(CREDIT_REPORT_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: "The upload failed. Check your connection and try again." };
  return { ok: true, path };
}

export async function removeCreditReport(path: string): Promise<void> {
  if (!path) return;
  const supabase = createSupabaseBrowserClient();
  await supabase.storage.from(CREDIT_REPORT_BUCKET).remove([path]);
}
