"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { maskId } from "@/features/clients/options";
import {
  clientDocumentUpdateSchema,
  clientDocumentUploadSchema,
  creditCheckSchema,
  newClientSchema,
} from "@/features/clients/schemas";
import { type ActionResult, friendlyDbError, issuesToFieldErrors } from "@/lib/actions";
import { requireRole } from "@/lib/auth/session";
import { lagosToday } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json, TablesInsert } from "@/types/database";

/** Create a client from the New Client wizard (one transaction in create_client). */
export async function createClient(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireRole("ceo");
  const parsed = newClientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the highlighted fields.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  }
  const v = parsed.data;
  const common = {
    id: v.id,
    client_type: v.client_type,
    enquiry_source: v.enquiry_source,
    referrer_id: v.referrer_id,
    sector: v.sector,
    notes: v.notes,
    consent: v.consent,
    documents: v.documents.map((d) => ({
      document_type_id: d.document_type_id,
      person_id: d.person_id,
      file_path: d.file_path,
      expiry_date: d.expiry_date,
    })),
  };
  const payload =
    v.client_type === "individual"
      ? { ...common, individual: v.individual }
      : {
          ...common,
          company: { ...v.company, sector: v.sector },
          directors: v.directors.map((d) => ({
            role: d.role,
            shareholding_pct: d.shareholding_pct,
            profile: d.profile,
          })),
        };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_client", { p: payload as Json });
  if (error) {
    if (error.message.includes("company_profiles_rc_number_key")) {
      const message = "A company with this CAC number is already a client.";
      return { ok: false, error: message, fieldErrors: { "company.rc_number": message } };
    }
    // create_client raises plain-language messages for the cases a person can fix.
    if (error.code === "22023" || error.code === "23505")
      return { ok: false, error: error.message };
    if (error.code === "23514") {
      return {
        ok: false,
        error: "Some details are in the wrong format. Check phones, BVN/NIN and dates.",
      };
    }
    return { ok: false, error: friendlyDbError(error, "this client") };
  }
  return { ok: true, data: { id: data } };
}

const lookupSchema = z
  .object({
    bvn: z
      .string()
      .regex(/^[0-9]{11}$/)
      .nullable(),
    nin: z
      .string()
      .regex(/^[0-9]{11}$/)
      .nullable(),
  })
  .refine((v) => v.bvn || v.nin);

export type PersonMatch = {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  bvn_masked: string | null;
  nin_masked: string | null;
  /** Set when this person is already a client in their own right. */
  client_id: string | null;
  client_name: string | null;
  /** Companies they already sit on as director/shareholder. */
  companies: string[];
};

/** Is someone with this BVN or NIN already on file? Used to link directors instead of duplicating. */
export async function findPerson(
  input: unknown,
): Promise<ActionResult<{ match: PersonMatch | null }>> {
  await requireRole("ceo");
  const parsed = lookupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter an 11-digit BVN or NIN." };
  const { bvn, nin } = parsed.data;
  const supabase = await createSupabaseServerClient();
  // Values are validated as 11 digits above, so they are safe inside the filter string.
  const filter = [bvn && `bvn.eq.${bvn}`, nin && `nin.eq.${nin}`].filter(Boolean).join(",");
  const { data, error } = await supabase
    .from("individual_profiles")
    .select(
      "id, first_name, middle_name, last_name, bvn, nin, client_id, clients!individual_profiles_client_id_fkey(display_name), company_directors(clients(display_name))",
    )
    .or(filter)
    .limit(2);
  if (error) return { ok: false, error: friendlyDbError(error, "the lookup") };
  if (data.length > 1) {
    return { ok: false, error: "That BVN and NIN belong to two different people on file." };
  }
  const p = data[0];
  if (!p) return { ok: true, data: { match: null } };
  return {
    ok: true,
    data: {
      match: {
        id: p.id,
        first_name: p.first_name,
        middle_name: p.middle_name,
        last_name: p.last_name,
        bvn_masked: maskId(p.bvn),
        nin_masked: maskId(p.nin),
        client_id: p.client_id,
        client_name: p.clients?.display_name ?? null,
        companies: p.company_directors.flatMap((d) =>
          d.clients?.display_name ? [d.clients.display_name] : [],
        ),
      },
    },
  };
}

async function refreshClientKycStatus(clientId: string) {
  const supabase = await createSupabaseServerClient();
  const [clientResult, typesResult, documentsResult, directorsResult] = await Promise.all([
    supabase.from("clients").select("client_type, kyc_status").eq("id", clientId).maybeSingle(),
    supabase.from("kyc_document_types").select("id, client_type, is_required"),
    supabase
      .from("client_documents")
      .select("document_type_id, individual_profile_id, status, expiry_date")
      .eq("client_id", clientId),
    supabase
      .from("company_directors")
      .select("individual_profile_id")
      .eq("company_client_id", clientId),
  ]);
  for (const result of [clientResult, typesResult, documentsResult, directorsResult]) {
    if (result.error) throw new Error(result.error.message);
  }
  const client = clientResult.data;
  if (!client) return;

  const requiredTypes = (typesResult.data ?? []).filter((type) => type.is_required);
  const expectedSlots = requiredTypes.flatMap((type) => {
    if (type.client_type === client.client_type) return [`client:${type.id}`];
    if (client.client_type !== "company" || type.client_type !== "individual") return [];
    return (directorsResult.data ?? []).map(
      (director) => `${director.individual_profile_id}:${type.id}`,
    );
  });
  const today = lagosToday();
  const complete = expectedSlots.every((slot) => {
    const [personId, typeId] = slot.split(":");
    return (documentsResult.data ?? []).some(
      (document) =>
        (document.individual_profile_id ?? "client") ===
          (personId === "client" ? "client" : personId) &&
        document.document_type_id === typeId &&
        (document.status === "received" || document.status === "verified") &&
        (!document.expiry_date || document.expiry_date >= today),
    );
  });

  const nextStatus = complete ? "submitted" : "incomplete";
  if (client.kyc_status !== "verified" && client.kyc_status !== nextStatus) {
    const { error } = await supabase
      .from("clients")
      .update({ kyc_status: nextStatus })
      .eq("id", clientId);
    if (error) throw new Error(error.message);
  }
}

function validateClientPath(clientId: string, path: string, bucket: string) {
  return (
    path.startsWith(`${clientId}/`) &&
    (bucket === "kyc" || bucket === "credit-reports") &&
    /^[A-Za-z0-9/_.\-]+$/.test(path)
  );
}

export async function saveClientDocument(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ceo");
  const parsed = clientDocumentUploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "The document details are invalid." };
  const { client_id, document_id, expiry_date, file_path } = parsed.data;
  if (!validateClientPath(client_id, file_path, "kyc")) {
    return { ok: false, error: "That document path is not valid for this client." };
  }
  const supabase = await createSupabaseServerClient();
  const { data: document, error: readError } = await supabase
    .from("client_documents")
    .select("id, client_id, file_path")
    .eq("id", document_id)
    .eq("client_id", client_id)
    .maybeSingle();
  if (readError) return { ok: false, error: friendlyDbError(readError, "this document") };
  if (!document) return { ok: false, error: "This document checklist item no longer exists." };

  const status = expiry_date && expiry_date < lagosToday() ? "expired" : "received";
  const { error } = await supabase
    .from("client_documents")
    .update({
      file_path,
      expiry_date,
      status,
      verified_by: null,
      verified_at: null,
    })
    .eq("id", document_id)
    .eq("client_id", client_id);
  if (error) return { ok: false, error: friendlyDbError(error, "this document") };
  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "update",
    entity_type: "client_document",
    entity_id: document_id,
    before: { file_path: document.file_path },
    after: { file_path, expiry_date, status },
  });
  await refreshClientKycStatus(client_id);
  refresh();
  return { ok: true };
}

export async function updateClientDocumentExpiry(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ceo");
  const parsed = clientDocumentUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid expiry date." };
  const { client_id, document_id, expiry_date } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data: document, error: readError } = await supabase
    .from("client_documents")
    .select("id, file_path, status")
    .eq("id", document_id)
    .eq("client_id", client_id)
    .maybeSingle();
  if (readError) return { ok: false, error: friendlyDbError(readError, "this document") };
  if (!document) return { ok: false, error: "This document checklist item no longer exists." };
  const nextStatus = !document.file_path
    ? "missing"
    : expiry_date && expiry_date < lagosToday()
      ? "expired"
      : document.status === "verified"
        ? "verified"
        : "received";
  const { error } = await supabase
    .from("client_documents")
    .update({ expiry_date, status: nextStatus })
    .eq("id", document_id)
    .eq("client_id", client_id);
  if (error) return { ok: false, error: friendlyDbError(error, "this document") };
  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "update",
    entity_type: "client_document",
    entity_id: document_id,
    before: { expiry_date: null },
    after: { expiry_date, status: nextStatus },
  });
  await refreshClientKycStatus(client_id);
  refresh();
  return { ok: true };
}

export async function verifyClientDocument(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ceo");
  const parsed = clientDocumentUpdateSchema
    .pick({ client_id: true, document_id: true })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "That document is not valid." };
  const { client_id, document_id } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data: document, error: readError } = await supabase
    .from("client_documents")
    .select("id, file_path, expiry_date")
    .eq("id", document_id)
    .eq("client_id", client_id)
    .maybeSingle();
  if (readError) return { ok: false, error: friendlyDbError(readError, "this document") };
  if (!document?.file_path) return { ok: false, error: "Upload the document before verifying it." };
  if (document.expiry_date && document.expiry_date < lagosToday()) {
    return { ok: false, error: "This document has expired. Upload a current copy first." };
  }
  const { error } = await supabase
    .from("client_documents")
    .update({ status: "verified", verified_by: user.id, verified_at: new Date().toISOString() })
    .eq("id", document_id)
    .eq("client_id", client_id);
  if (error) return { ok: false, error: friendlyDbError(error, "this document") };
  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "update",
    entity_type: "client_document",
    entity_id: document_id,
    after: { status: "verified" },
  });
  await refreshClientKycStatus(client_id);
  refresh();
  return { ok: true };
}

export async function addCreditCheck(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireRole("ceo");
  const parsed = creditCheckSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the credit check details.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  }
  const value = parsed.data;
  if (
    value.report_file_path &&
    !validateClientPath(value.client_id, value.report_file_path, "credit-reports")
  ) {
    return { ok: false, error: "That report path is not valid for this client." };
  }
  const supabase = await createSupabaseServerClient();
  const creditInsert = {
    client_id: value.client_id,
    bureau: value.bureau,
    check_date: value.check_date,
    rating: value.rating,
    score: value.score,
    total_exposure: value.total_exposure,
    delinquent_facilities: value.delinquent_facilities,
    remarks: value.remarks,
    report_file_path: value.report_file_path,
  } as unknown as TablesInsert<"credit_checks">;
  const { data: check, error } = await supabase
    .from("credit_checks")
    .insert(creditInsert)
    .select("id")
    .single();
  if (error || !check) return { ok: false, error: friendlyDbError(error, "this credit check") };

  if (value.exposures.length > 0) {
    const exposureInsert = value.exposures.map((exposure) => ({
      client_id: value.client_id,
      lender_name: exposure.lender_name,
      facility_type: exposure.facility_type,
      amount: exposure.amount,
      outstanding: exposure.outstanding,
      status: exposure.status,
    })) as unknown as TablesInsert<"external_exposures">[];
    const { error: exposureError } = await supabase
      .from("external_exposures")
      .insert(exposureInsert);
    if (exposureError) return { ok: false, error: friendlyDbError(exposureError, "the exposures") };
  }
  refresh();
  return { ok: true, data: { id: check.id } };
}

const signedFileSchema = z.object({
  client_id: z.uuid(),
  bucket: z.enum(["kyc", "credit-reports"]),
  path: z
    .string()
    .regex(/^[A-Za-z0-9/_.\-]+$/)
    .max(300),
});

export async function getClientSignedFileUrl(
  input: unknown,
): Promise<ActionResult<{ url: string }>> {
  const user = await requireRole("ceo");
  const parsed = signedFileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That file is not valid." };
  const { client_id, bucket, path } = parsed.data;
  if (!validateClientPath(client_id, path, bucket))
    return { ok: false, error: "That file is not valid." };

  const supabase = await createSupabaseServerClient();
  const query =
    bucket === "kyc"
      ? supabase
          .from("client_documents")
          .select("id")
          .eq("client_id", client_id)
          .eq("file_path", path)
          .maybeSingle()
      : supabase
          .from("credit_checks")
          .select("id")
          .eq("client_id", client_id)
          .eq("report_file_path", path)
          .maybeSingle();
  const { data: fileRecord, error: recordError } = await query;
  if (recordError) return { ok: false, error: friendlyDbError(recordError, "this file") };
  if (!fileRecord) return { ok: false, error: "That file is no longer attached to this client." };
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
  if (error || !data?.signedUrl) return { ok: false, error: "The file could not be opened." };
  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "signed_url",
    entity_type: bucket === "kyc" ? "client_document" : "credit_check",
    entity_id: fileRecord.id,
    after: { bucket, path },
  });
  return { ok: true, data: { url: data.signedUrl } };
}
