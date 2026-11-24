"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const REPAYMENT_PROOF_BUCKET = "repayment-proofs";
export const REPAYMENT_PROOF_MAX_BYTES = 10 * 1024 * 1024;
const EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const REPAYMENT_PROOF_ACCEPT = Object.keys(EXT).join(",");

export function checkRepaymentProofFile(file: File): string | null {
  if (!EXT[file.type]) return "Use a PDF, JPEG, PNG or WebP file.";
  if (file.size > REPAYMENT_PROOF_MAX_BYTES) return "Files must be 10 MB or smaller.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

export async function uploadRepaymentProof(
  dealId: string,
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const problem = checkRepaymentProofFile(file);
  if (problem) return { ok: false, error: problem };
  const path = `${dealId}/${crypto.randomUUID()}.${EXT[file.type]}`;
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(REPAYMENT_PROOF_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: "The upload failed. Check your connection and try again." };
  return { ok: true, path };
}

export async function removeRepaymentProof(path: string): Promise<void> {
  if (!path) return;
  const supabase = createSupabaseBrowserClient();
  await supabase.storage.from(REPAYMENT_PROOF_BUCKET).remove([path]);
}
