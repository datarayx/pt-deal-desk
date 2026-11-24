"use server";

import { z } from "zod";

import { maskId } from "@/features/clients/options";
import { newClientSchema } from "@/features/clients/schemas";
import { type ActionResult, friendlyDbError, issuesToFieldErrors } from "@/lib/actions";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

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
