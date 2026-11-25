"use server";

import ExcelJS from "exceljs";
import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { z } from "zod";

import { createClient } from "@/features/clients/actions";
import { definitionFor, importDefinitions, type ImportDomain, type ImportMode } from "@/features/imports/catalog";
import { previewRows, validateWorkbook, type ImportSheetData } from "@/features/imports/logic";
import { saveFinancier, saveRequirement } from "@/features/financiers/actions";
import { saveReferrer } from "@/features/referrers/actions";
import { postManualJournal, saveAccount } from "@/features/accounting/actions";
import { type ActionResult, friendlyDbError } from "@/lib/actions";
import { requireRole, type CurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json, TablesInsert } from "@/types/database";

const domainSchema = z.enum(["partners", "clients", "deals", "repayments", "accounting"]);
const modeSchema = z.enum(["historical", "live"]);

type RpcResult<T> = { data: T | null; error: { message: string } | null };
type Rpc = (name: string, args: Record<string, Json | undefined>) => Promise<RpcResult<unknown>>;

type ImportRow = {
  sheet_name: string;
  row_number: number;
  payload: Record<string, string>;
  status: string;
  errors: string[];
};

type ImportBatchData = {
  batch: { id: string; domain: ImportDomain; mode: ImportMode; status: string };
  rows: ImportRow[];
};

function rpcFor(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  return supabase.rpc as unknown as Rpc;
}

function cellText(value: ExcelJS.CellValue) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("result" in value && value.result !== undefined) return String(value.result);
  }
  return String(value);
}

async function readWorkbook(file: File, definition: ReturnType<typeof definitionFor>) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheets: ImportSheetData[] = [];
  for (const template of definition.sheets) {
    const worksheet = workbook.getWorksheet(template.name);
    if (!worksheet) continue;
    const headerValues = worksheet.getRow(1).values;
    const rawHeaders = Array.isArray(headerValues) ? headerValues.slice(1) : [];
    const headers = rawHeaders.map((value: ExcelJS.CellValue) => cellText(value).trim());
    const rows: Record<string, string>[] = [];
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const payload = Object.fromEntries(
        headers.map((header: string, index: number) => [header, cellText(row.getCell(index + 1).value).trim()]),
      );
      if (Object.values(payload).some(Boolean)) rows.push(payload);
    }
    sheets.push({ name: template.name, headers, rows });
  }
  return sheets;
}

function canImport(user: CurrentUser, domain: ImportDomain) {
  return definitionFor(domain).roles.includes(user.role);
}

function text(row: Record<string, string>, key: string) {
  return row[key]?.trim() ?? "";
}

function optional(row: Record<string, string>, key: string) {
  const value = text(row, key);
  return value || null;
}

function booleanValue(row: Record<string, string>, key: string) {
  return ["true", "yes", "1", "y"].includes(text(row, key).toLowerCase());
}

async function readBatch(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, id: string) {
  const result = await rpcFor(supabase)("read_import_batch", { p_batch_id: id });
  if (result.error || !result.data || typeof result.data !== "object") return null;
  const value = result.data as { batch?: ImportBatchData["batch"]; rows?: ImportRow[] };
  if (!value.batch || !Array.isArray(value.rows)) return null;
  return { batch: value.batch, rows: value.rows } satisfies ImportBatchData;
}

async function readRefs(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  entityType: "referrer" | "financier" | "client" | "deal",
  externalIds: string[],
) {
  if (externalIds.length === 0) return {} as Record<string, string>;
  const result = await rpcFor(supabase)("read_import_refs", {
    p_entity_type: entityType,
    p_external_ids: externalIds as unknown as Json,
  });
  if (result.error || !result.data || typeof result.data !== "object") return {};
  return Object.fromEntries(
    Object.entries(result.data as Record<string, unknown>).filter(
      ([, value]) => typeof value === "string",
    ),
  ) as Record<string, string>;
}

async function saveRef(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  entityType: "referrer" | "financier" | "client" | "deal",
  externalId: string,
  entityId: string,
) {
  const result = await rpcFor(supabase)("save_import_ref", {
    p_entity_type: entityType,
    p_external_id: externalId,
    p_entity_id: entityId,
  });
  return result.error;
}

type CommitError = { sheet: string; row: number; error: string };

async function commitPartners(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  rows: ImportRow[],
) {
  const errors: CommitError[] = [];
  const refs = new Map<string, string>();
  for (const row of rows.filter((item) => item.sheet_name === "referrers")) {
    const result = await saveReferrer(null, {
      name: text(row.payload, "name"),
      referrer_type: text(row.payload, "referrer_type"),
      contact_person: text(row.payload, "contact_person"),
      phone: text(row.payload, "phone"),
      email: text(row.payload, "email"),
      default_fee_type: text(row.payload, "default_fee_type") || "none",
      default_fee_value: text(row.payload, "default_fee_value"),
      bank_name: text(row.payload, "bank_name"),
      account_name: text(row.payload, "account_name"),
    });
    if (!result.ok || !result.data) {
      errors.push({ sheet: row.sheet_name, row: row.row_number, error: result.ok ? "Referrer was not returned." : result.error });
      continue;
    }
    refs.set(text(row.payload, "external_id"), result.data.id);
    const refError = await saveRef(supabase, "referrer", text(row.payload, "external_id"), result.data.id);
    if (refError) errors.push({ sheet: row.sheet_name, row: row.row_number, error: refError.message });
  }
  for (const row of rows.filter((item) => item.sheet_name === "financiers")) {
    const result = await saveFinancier(null, {
      name: text(row.payload, "name"),
      financier_type: text(row.payload, "financier_type"),
      contact_person: text(row.payload, "contact_person"),
      phone: text(row.payload, "phone"),
      email: text(row.payload, "email"),
      rate_min_monthly: text(row.payload, "rate_min_monthly"),
      rate_max_monthly: text(row.payload, "rate_max_monthly"),
      facility_types: text(row.payload, "facility_types").split(";").map((value) => value.trim()).filter(Boolean),
      collateral_policy: text(row.payload, "collateral_policy"),
      notes: text(row.payload, "notes"),
    });
    if (!result.ok || !result.data) {
      errors.push({ sheet: row.sheet_name, row: row.row_number, error: result.ok ? "Financier was not returned." : result.error });
      continue;
    }
    const externalId = text(row.payload, "external_id");
    refs.set(externalId, result.data.id);
    const refError = await saveRef(supabase, "financier", externalId, result.data.id);
    if (refError) errors.push({ sheet: row.sheet_name, row: row.row_number, error: refError.message });
  }
  for (const row of rows.filter((item) => item.sheet_name === "financier_requirements")) {
    const financierId = refs.get(text(row.payload, "financier_external_id")) ?? (await readRefs(supabase, "financier", [text(row.payload, "financier_external_id")]))[text(row.payload, "financier_external_id")];
    if (!financierId) {
      errors.push({ sheet: row.sheet_name, row: row.row_number, error: "The financier_external_id was not found in this or an earlier import." });
      continue;
    }
    const result = await saveRequirement(financierId, null, {
      item: text(row.payload, "item"),
      is_required: booleanValue(row.payload, "is_required"),
    });
    if (!result.ok) errors.push({ sheet: row.sheet_name, row: row.row_number, error: result.error });
  }
  return { errors, processed: rows.length - errors.length };
}

async function commitAccounting(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  rows: ImportRow[],
) {
  const errors: CommitError[] = [];
  for (const row of rows.filter((item) => item.sheet_name === "accounts")) {
    const result = await saveAccount(null, {
      code: text(row.payload, "code"),
      name: text(row.payload, "name"),
      type: text(row.payload, "type"),
      subtype: text(row.payload, "subtype"),
      parent_id: "",
    });
    if (!result.ok) errors.push({ sheet: row.sheet_name, row: row.row_number, error: result.error });
  }
  const accountRows = rows.filter((item) => item.sheet_name === "accounts");
  const accountCodes = accountRows.map((row) => text(row.payload, "code"));
  const accountLookup = await supabase.from("accounts").select("id, code").in("code", accountCodes);
  if (accountLookup.error) errors.push({ sheet: "accounts", row: 1, error: accountLookup.error.message });
  for (const row of accountRows) {
    const parentCode = text(row.payload, "parent_code");
    if (!parentCode) continue;
    const accountId = accountLookup.data?.find((account) => account.code === text(row.payload, "code"))?.id;
    const parentId = accountLookup.data?.find((account) => account.code === parentCode)?.id;
    if (!accountId || !parentId) {
      errors.push({ sheet: row.sheet_name, row: row.row_number, error: "parent_code was not found in the imported chart." });
      continue;
    }
    const updated = await supabase.from("accounts").update({ parent_id: parentId }).eq("id", accountId);
    if (updated.error) errors.push({ sheet: row.sheet_name, row: row.row_number, error: updated.error.message });
  }
  const headers = rows.filter((item) => item.sheet_name === "journals");
  for (const header of headers) {
    const externalId = text(header.payload, "external_id");
    const lines = rows
      .filter((item) => item.sheet_name === "journal_lines" && text(item.payload, "journal_external_id") === externalId)
      .map((item) => ({
        account: text(item.payload, "account_code"),
        debit: text(item.payload, "debit"),
        credit: text(item.payload, "credit"),
        description: text(item.payload, "description"),
      }));
    const result = await postManualJournal({
      entry_date: text(header.payload, "entry_date"),
      reference: text(header.payload, "reference"),
      memo: text(header.payload, "memo"),
      lines,
    });
    if (!result.ok) errors.push({ sheet: header.sheet_name, row: header.row_number, error: result.error });
  }
  return { errors, processed: rows.length - errors.length };
}

function personPayload(row: Record<string, string>) {
  return {
    id: randomUUID(),
    title: text(row, "title"),
    first_name: text(row, "first_name"),
    middle_name: text(row, "middle_name"),
    last_name: text(row, "last_name"),
    gender: text(row, "gender"),
    date_of_birth: text(row, "date_of_birth"),
    phone: text(row, "phone"),
    email: text(row, "email"),
    residential_address: text(row, "residential_address"),
    state: text(row, "state"),
    lga: text(row, "lga"),
    occupation: text(row, "occupation"),
    employer_or_business: text(row, "employer_or_business"),
    monthly_income_range: text(row, "monthly_income_range"),
    bvn: text(row, "bvn"),
    nin: text(row, "nin"),
    id_type: text(row, "id_type"),
    id_number: text(row, "id_number"),
    id_expiry: text(row, "id_expiry"),
    next_of_kin_name: text(row, "next_of_kin_name"),
    next_of_kin_phone: text(row, "next_of_kin_phone"),
    next_of_kin_relationship: text(row, "next_of_kin_relationship"),
    is_pep: booleanValue(row, "is_pep"),
  };
}

async function commitClients(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  rows: ImportRow[],
) {
  const errors: CommitError[] = [];
  const clientRows = rows.filter((item) => item.sheet_name === "clients");
  const referrerIds = await readRefs(
    supabase,
    "referrer",
    clientRows.map((row) => text(row.payload, "referrer_external_id")).filter(Boolean),
  );
  const directorsByClient = new Map<string, ImportRow[]>();
  for (const row of rows.filter((item) => item.sheet_name === "directors")) {
    const key = text(row.payload, "client_external_id");
    directorsByClient.set(key, [...(directorsByClient.get(key) ?? []), row]);
  }

  const clientIds = new Map<string, string>();
  for (const row of clientRows) {
    const clientType = text(row.payload, "client_type");
    const common = {
      id: randomUUID(),
      enquiry_source: text(row.payload, "enquiry_source"),
      referrer_id: referrerIds[text(row.payload, "referrer_external_id")] ?? "",
      sector: text(row.payload, "sector"),
      notes: text(row.payload, "notes"),
      documents: [],
      consent: booleanValue(row.payload, "consent"),
    };
    const input = clientType === "company"
      ? {
          ...common,
          client_type: "company" as const,
          company: {
            registered_name: text(row.payload, "registered_name"),
            company_type: text(row.payload, "company_type"),
            rc_number: text(row.payload, "rc_number"),
            incorporation_date: text(row.payload, "incorporation_date"),
            registered_address: text(row.payload, "registered_address"),
            operating_address: text(row.payload, "operating_address"),
            tin: text(row.payload, "tin"),
            annual_turnover_range: text(row.payload, "annual_turnover_range"),
            website: text(row.payload, "website"),
            contact_person: text(row.payload, "contact_person"),
            contact_phone: text(row.payload, "contact_phone"),
            contact_email: text(row.payload, "contact_email"),
          },
          directors: (directorsByClient.get(text(row.payload, "external_id")) ?? []).map((director) => ({
            profile: personPayload(director.payload),
            role: text(director.payload, "role"),
            shareholding_pct: text(director.payload, "shareholding_pct"),
          })),
        }
      : {
          ...common,
          client_type: "individual" as const,
          individual: personPayload(row.payload),
        };
    const result = await createClient(input);
    if (!result.ok || !result.data) {
      errors.push({ sheet: row.sheet_name, row: row.row_number, error: result.ok ? "Client was not returned." : result.error });
      continue;
    }
    const externalId = text(row.payload, "external_id");
    clientIds.set(externalId, result.data.id);
    const refError = await saveRef(supabase, "client", externalId, result.data.id);
    if (refError) errors.push({ sheet: row.sheet_name, row: row.row_number, error: refError.message });
  }

  const knownClients = {
    ...Object.fromEntries(clientIds),
    ...(await readRefs(supabase, "client", clientRows.map((row) => text(row.payload, "external_id")))),
  };
  const documentTypes = await supabase.from("kyc_document_types").select("id, name, client_type");
  if (documentTypes.error) errors.push({ sheet: "documents", row: 1, error: documentTypes.error.message });
  for (const row of rows.filter((item) => item.sheet_name === "documents")) {
    const clientId = knownClients[text(row.payload, "client_external_id")];
    const type = documentTypes.data?.find((item) => item.name === text(row.payload, "document_type_name"));
    if (!clientId || !type) {
      errors.push({ sheet: row.sheet_name, row: row.row_number, error: !clientId ? "Client external ID was not found." : "Document type was not found." });
      continue;
    }
    const path = text(row.payload, "file_path");
    if (!path.startsWith(`${clientId}/`)) {
      errors.push({ sheet: row.sheet_name, row: row.row_number, error: "file_path must begin with the imported client's new ID." });
      continue;
    }
    const document = await supabase
      .from("client_documents")
      .select("id")
      .eq("client_id", clientId)
      .eq("document_type_id", type.id)
      .is("individual_profile_id", null)
      .maybeSingle();
    if (document.error || !document.data) {
      errors.push({ sheet: row.sheet_name, row: row.row_number, error: document.error?.message ?? "Client document checklist item was not found." });
      continue;
    }
    const update = await supabase.from("client_documents").update({ file_path: path, expiry_date: optional(row.payload, "expiry_date"), status: "received" }).eq("id", document.data.id).eq("client_id", clientId);
    if (update.error) errors.push({ sheet: row.sheet_name, row: row.row_number, error: update.error.message });
  }
  for (const row of rows.filter((item) => item.sheet_name === "credit_checks")) {
    const clientId = knownClients[text(row.payload, "client_external_id")];
    if (!clientId) {
      errors.push({ sheet: row.sheet_name, row: row.row_number, error: "Client external ID was not found." });
      continue;
    }
    const insert = await supabase.from("credit_checks").insert({
      client_id: clientId,
      bureau: text(row.payload, "bureau"),
      check_date: text(row.payload, "check_date"),
      rating: optional(row.payload, "rating"),
      score: optional(row.payload, "score") ? Number(text(row.payload, "score")) : null,
      total_exposure: optional(row.payload, "total_exposure"),
      delinquent_facilities: Number(text(row.payload, "delinquent_facilities") || "0"),
      remarks: optional(row.payload, "remarks"),
      report_file_path: optional(row.payload, "report_file_path"),
    } as unknown as TablesInsert<"credit_checks">);
    if (insert.error) errors.push({ sheet: row.sheet_name, row: row.row_number, error: insert.error.message });
  }
  for (const row of rows.filter((item) => item.sheet_name === "exposures")) {
    const clientId = knownClients[text(row.payload, "client_external_id")];
    if (!clientId) {
      errors.push({ sheet: row.sheet_name, row: row.row_number, error: "Client external ID was not found." });
      continue;
    }
    const insert = await supabase.from("external_exposures").insert({
      client_id: clientId,
      lender_name: text(row.payload, "lender_name"),
      facility_type: optional(row.payload, "facility_type"),
      amount: text(row.payload, "amount"),
      outstanding: text(row.payload, "outstanding"),
      status: text(row.payload, "status"),
    } as unknown as TablesInsert<"external_exposures">);
    if (insert.error) errors.push({ sheet: row.sheet_name, row: row.row_number, error: insert.error.message });
  }
  return { errors, processed: rows.length - errors.length };
}

async function commitDeals(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  user: CurrentUser,
  rows: ImportRow[],
) {
  const errors: CommitError[] = [];
  const dealsRows = rows.filter((item) => item.sheet_name === "deals");
  const clientIds = await readRefs(supabase, "client", dealsRows.map((row) => text(row.payload, "client_external_id")));
  const financierIds = await readRefs(supabase, "financier", dealsRows.map((row) => text(row.payload, "financier_external_id")));
  const referrerIds = await readRefs(supabase, "referrer", dealsRows.map((row) => text(row.payload, "referrer_external_id")).filter(Boolean));
  const facilityTypes = await supabase.from("facility_types").select("id, name");
  const stages = await supabase.from("deal_stages").select("id, name");
  const dealIds = new Map<string, string>();
  for (const row of dealsRows) {
    const payload = row.payload;
    const clientId = clientIds[text(payload, "client_external_id")];
    const facilityTypeId = facilityTypes.data?.find((item) => item.name === text(payload, "facility_type_name"))?.id;
    const stageId = stages.data?.find((item) => item.name === text(payload, "stage_name"))?.id ?? stages.data?.[0]?.id;
    if (!clientId || !facilityTypeId || !stageId) {
      errors.push({ sheet: row.sheet_name, row: row.row_number, error: !clientId ? "Client external ID was not found." : !facilityTypeId ? "Facility type was not found." : "Deal stage was not found." });
      continue;
    }
    const dealInsert = {
      reference: text(payload, "reference"),
      client_id: clientId,
      financier_id: financierIds[text(payload, "financier_external_id")] ?? null,
      referrer_id: referrerIds[text(payload, "referrer_external_id")] ?? null,
      facility_type_id: facilityTypeId,
      stage_id: stageId,
      stage_entered_at: optional(payload, "offer_date") ?? new Date().toISOString(),
      outcome: text(payload, "outcome") || "open",
      amount_requested: text(payload, "amount_requested"),
      amount_approved: optional(payload, "amount_approved"),
      amount_disbursed: optional(payload, "amount_disbursed"),
      tenor_months: optional(payload, "tenor_months") ? Number(text(payload, "tenor_months")) : null,
      interest_rate_monthly: optional(payload, "interest_rate_monthly"),
      purpose: optional(payload, "purpose"),
      collateral_type: optional(payload, "collateral_type"),
      collateral_value: optional(payload, "collateral_value"),
      guarantor_name: optional(payload, "guarantor_name"),
      guarantor_cheques: booleanValue(payload, "guarantor_cheques"),
      other_fees_note: optional(payload, "other_fees_note"),
      offer_date: optional(payload, "offer_date"),
      disbursement_date: optional(payload, "disbursement_date"),
      first_repayment_date: optional(payload, "first_repayment_date"),
      maturity_date: optional(payload, "maturity_date"),
      repayment_frequency: optional(payload, "repayment_frequency"),
      decline_reason: optional(payload, "decline_reason"),
      owner_id: user.id,
    } as unknown as TablesInsert<"deals">;
    const inserted = await supabase.from("deals").insert(dealInsert).select("id").single();
    if (inserted.error || !inserted.data) {
      errors.push({ sheet: row.sheet_name, row: row.row_number, error: inserted.error?.message ?? "Deal was not created." });
      continue;
    }
    const externalId = text(payload, "external_id");
    dealIds.set(externalId, inserted.data.id);
    const refError = await saveRef(supabase, "deal", externalId, inserted.data.id);
    if (refError) errors.push({ sheet: row.sheet_name, row: row.row_number, error: refError.message });
  }
  const knownDeals = { ...Object.fromEntries(dealIds), ...(await readRefs(supabase, "deal", rows.filter((row) => row.sheet_name === "deals").map((row) => text(row.payload, "external_id")))) };
  for (const row of rows.filter((item) => item.sheet_name === "deal_requirements")) {
    const dealId = knownDeals[text(row.payload, "deal_external_id")];
    if (!dealId) { errors.push({ sheet: row.sheet_name, row: row.row_number, error: "Deal external ID was not found." }); continue; }
    const inserted = await supabase.from("deal_requirements").insert({
      deal_id: dealId,
      item: text(row.payload, "item"),
      is_required: text(row.payload, "is_required") ? booleanValue(row.payload, "is_required") : true,
      status: text(row.payload, "status") || "pending",
      file_path: optional(row.payload, "file_path"),
    } as unknown as TablesInsert<"deal_requirements">);
    if (inserted.error) errors.push({ sheet: row.sheet_name, row: row.row_number, error: inserted.error.message });
  }
  for (const row of rows.filter((item) => item.sheet_name === "activities")) {
    const entityType = text(row.payload, "entity_type");
    const entityId = entityType === "deal" ? knownDeals[text(row.payload, "entity_external_id")] : entityType === "client" ? (await readRefs(supabase, "client", [text(row.payload, "entity_external_id")]))[text(row.payload, "entity_external_id")] : (await readRefs(supabase, "referrer", [text(row.payload, "entity_external_id")]))[text(row.payload, "entity_external_id")];
    if (!entityId) { errors.push({ sheet: row.sheet_name, row: row.row_number, error: "Activity entity external ID was not found." }); continue; }
    const inserted = await supabase.from("activities").insert({ entity_type: entityType, entity_id: entityId, kind: text(row.payload, "kind"), body: text(row.payload, "body"), occurred_at: text(row.payload, "occurred_at") } as unknown as TablesInsert<"activities">);
    if (inserted.error) errors.push({ sheet: row.sheet_name, row: row.row_number, error: inserted.error.message });
  }
  return { errors, processed: rows.length - errors.length };
}

async function commitRepayments(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  rows: ImportRow[],
) {
  const errors: CommitError[] = [];
  const scheduleRows = rows.filter((item) => item.sheet_name === "schedules");
  const dealIds = await readRefs(supabase, "deal", scheduleRows.map((row) => text(row.payload, "deal_external_id")));
  const schedules = new Map<string, string>();
  for (const row of scheduleRows) {
    const dealId = dealIds[text(row.payload, "deal_external_id")];
    if (!dealId) { errors.push({ sheet: row.sheet_name, row: row.row_number, error: "Deal external ID was not found." }); continue; }
    const inserted = await supabase.from("repayment_schedules").insert({
      deal_id: dealId,
      instalment_no: Number(text(row.payload, "instalment_no")),
      due_date: text(row.payload, "due_date"),
      principal_due: text(row.payload, "principal_due"),
      interest_due: text(row.payload, "interest_due"),
      total_due: text(row.payload, "total_due"),
      status: text(row.payload, "status"),
      days_overdue: Number(text(row.payload, "days_overdue") || "0"),
    } as unknown as TablesInsert<"repayment_schedules">).select("id").single();
    if (inserted.error || !inserted.data) { errors.push({ sheet: row.sheet_name, row: row.row_number, error: inserted.error?.message ?? "Schedule was not created." }); continue; }
    schedules.set(`${text(row.payload, "deal_external_id")}:${text(row.payload, "instalment_no")}`, inserted.data.id);
  }
  for (const row of rows.filter((item) => item.sheet_name === "payments")) {
    const scheduleId = schedules.get(`${text(row.payload, "deal_external_id")}:${text(row.payload, "instalment_no")}`);
    if (!scheduleId) { errors.push({ sheet: row.sheet_name, row: row.row_number, error: "The payment's schedule was not found in this batch." }); continue; }
    const confirmed = text(row.payload, "status") === "confirmed";
    const inserted = await supabase.from("repayment_reports").insert({
      schedule_id: scheduleId,
      amount: text(row.payload, "amount"),
      paid_on: text(row.payload, "paid_on"),
      channel: text(row.payload, "channel"),
      proof_file_path: optional(row.payload, "proof_file_path"),
      confirmed_by_financier: confirmed,
      confirmed_at: confirmed ? optional(row.payload, "confirmed_at") ?? new Date().toISOString() : null,
      confirmation_note: optional(row.payload, "confirmation_note"),
    } as unknown as TablesInsert<"repayment_reports">);
    if (inserted.error) errors.push({ sheet: row.sheet_name, row: row.row_number, error: inserted.error.message });
  }
  return { errors, processed: rows.length - errors.length };
}

export type StagedImport = {
  batchId: string;
  sourceName: string;
  rowCount: number;
  errorCount: number;
  preview: ReturnType<typeof previewRows>;
  errors: ReturnType<typeof validateWorkbook>;
};

export async function stageImport(formData: FormData): Promise<ActionResult<StagedImport>> {
  const user = await requireRole("ceo", "accountant");
  const domain = domainSchema.safeParse(formData.get("domain"));
  const mode = modeSchema.safeParse(formData.get("mode"));
  const file = formData.get("file");
  if (!domain.success || !mode.success || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an import type, mode and Excel workbook." };
  }
  if (!canImport(user, domain.data)) {
    return { ok: false, error: "Your role cannot import this type of data." };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { ok: false, error: "Workbooks must be 20 MB or smaller. Split the import into batches." };
  }

  const definition = definitionFor(domain.data);
  let sheets: ImportSheetData[];
  try {
    sheets = await readWorkbook(file, definition);
  } catch {
    return { ok: false, error: "The workbook could not be read. Download a fresh template and try again." };
  }
  const errors = validateWorkbook(definition, sheets);
  const rows = previewRows(sheets, Number.MAX_SAFE_INTEGER);
  if (rows.length === 0) return { ok: false, error: "The workbook has no data rows to import." };
  const supabase = await createSupabaseServerClient();
  const rpc = rpcFor(supabase);
  const result = await rpc("stage_import_batch", {
    p_domain: domain.data,
    p_mode: mode.data,
    p_source_name: file.name,
    p_rows: rows.map((row) => ({
      sheet: row.sheet,
      row: row.row,
      payload: row.payload,
      errors: errors
        .filter((error) => error.sheet === row.sheet && error.row === row.row)
        .flatMap((error) => error.errors),
    })) as unknown as Json,
  });
  if (result.error || typeof result.data !== "string") {
    return { ok: false, error: friendlyDbError(result.error, "this import") };
  }

  refresh();
  return {
    ok: true,
    data: {
      batchId: result.data,
      sourceName: file.name,
      rowCount: rows.length,
      errorCount: errors.length,
      preview: previewRows(sheets, 50),
      errors,
    },
  };
}

export type ImportCommitResult = {
  batchId: string;
  processed: number;
  errors: CommitError[];
};

export async function commitImport(batchId: unknown): Promise<ActionResult<ImportCommitResult>> {
  const user = await requireRole("ceo", "accountant");
  const parsed = z.uuid().safeParse(batchId);
  if (!parsed.success) return { ok: false, error: "Unknown import batch." };
  const supabase = await createSupabaseServerClient();
  const batch = await readBatch(supabase, parsed.data);
  if (!batch) return { ok: false, error: "This import batch no longer exists." };
  if (!canImport(user, batch.batch.domain)) return { ok: false, error: "Your role cannot commit this import." };
  if (batch.batch.status !== "staged") return { ok: false, error: "This batch has already been processed." };
  const invalidRows = batch.rows.filter((row) => row.status === "invalid");
  if (invalidRows.length > 0) return { ok: false, error: "Fix all validation errors before committing this batch." };

  const starting = await rpcFor(supabase)("finish_import_batch", {
    p_batch_id: parsed.data,
    p_status: "committing",
  });
  if (starting.error) return { ok: false, error: friendlyDbError(starting.error, "this import") };

  let result: { errors: CommitError[]; processed: number };
  switch (batch.batch.domain) {
    case "partners":
      result = await commitPartners(supabase, batch.rows);
      break;
    case "clients":
      result = await commitClients(supabase, batch.rows);
      break;
    case "deals":
      result = await commitDeals(supabase, user, batch.rows);
      break;
    case "repayments":
      result = await commitRepayments(supabase, batch.rows);
      break;
    case "accounting":
      result = await commitAccounting(supabase, batch.rows);
      break;
  }

  const finalStatus = result.errors.length > 0 ? "failed" : "committed";
  const finished = await rpcFor(supabase)("finish_import_batch", {
    p_batch_id: parsed.data,
    p_status: finalStatus,
  });
  if (finished.error) return { ok: false, error: friendlyDbError(finished.error, "this import") };
  refresh();
  return { ok: true, data: { batchId: parsed.data, processed: result.processed, errors: result.errors } };
}

export async function cancelImport(batchId: unknown): Promise<ActionResult> {
  await requireRole("ceo", "accountant");
  const parsed = z.uuid().safeParse(batchId);
  if (!parsed.success) return { ok: false, error: "Unknown import batch." };
  const supabase = await createSupabaseServerClient();
  const result = await rpcFor(supabase)("finish_import_batch", {
    p_batch_id: parsed.data,
    p_status: "cancelled",
  });
  if (result.error) return { ok: false, error: friendlyDbError(result.error, "this import") };
  refresh();
  return { ok: true };
}

export { importDefinitions };

