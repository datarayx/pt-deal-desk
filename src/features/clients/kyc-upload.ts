// Browser-side helpers for New Client KYC uploads. Files go straight to the private `kyc` bucket
// (Storage RLS: CEO only) under "<client id>/<person id | client>/…"; create_client checks every
// path is inside the new client's folder and that the file exists.

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const KYC_BUCKET = "kyc";
export const KYC_MAX_BYTES = 10 * 1024 * 1024;
const EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
export const KYC_ACCEPT = Object.keys(EXT).join(",");

export function checkKycFile(file: File): string | null {
  if (!EXT[file.type]) return "Use a PDF, JPEG, PNG or WebP file.";
  if (file.size > KYC_MAX_BYTES) return "Files must be 10 MB or smaller.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

export async function uploadKycFile(
  clientId: string,
  personId: string | null,
  documentTypeId: string,
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const problem = checkKycFile(file);
  if (problem) return { ok: false, error: problem };
  const path = `${clientId}/${personId ?? "client"}/${documentTypeId}-${Date.now().toString(36)}.${EXT[file.type]}`;
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(KYC_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: "The upload failed. Check your connection and try again." };
  return { ok: true, path };
}

/** Best-effort removal of files the user replaced or abandoned. */
export async function removeKycFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = createSupabaseBrowserClient();
  await supabase.storage.from(KYC_BUCKET).remove(paths);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
