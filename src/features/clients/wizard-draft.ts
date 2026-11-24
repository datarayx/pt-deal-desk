import type { z } from "zod";

import type { ClientType, EnquirySource } from "@/features/clients/options";
import type {
  companySchema,
  DirectorInput,
  DocumentInput,
  individualSchema,
} from "@/features/clients/schemas";

// The New Client wizard keeps the RAW form values of every step here, so going back shows exactly
// what was typed. The Server Action parses the whole draft with newClientSchema.

export type PersonInput = z.input<typeof individualSchema>;
export type CompanyInput = z.input<typeof companySchema>;

export type Draft = {
  id: string;
  client_type: ClientType;
  enquiry_source: EnquirySource | "";
  referrer_id: string;
  sector: string;
  notes: string;
  individual: PersonInput;
  company: CompanyInput;
  directors: DirectorInput[];
  documents: DocumentInput[];
  consent: boolean;
};

export function emptyPerson(id: string = crypto.randomUUID()): PersonInput {
  return {
    id,
    title: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    date_of_birth: "",
    phone: "",
    email: "",
    residential_address: "",
    state: "",
    lga: "",
    occupation: "",
    employer_or_business: "",
    monthly_income_range: "",
    bvn: "",
    nin: "",
    id_type: "",
    id_number: "",
    id_expiry: "",
    next_of_kin_name: "",
    next_of_kin_phone: "",
    next_of_kin_relationship: "",
    is_pep: false,
  };
}

export function emptyDraft(): Draft {
  return {
    id: crypto.randomUUID(),
    client_type: "company",
    enquiry_source: "",
    referrer_id: "",
    sector: "",
    notes: "",
    individual: emptyPerson(),
    company: {
      registered_name: "",
      company_type: "ltd",
      rc_number: "",
      incorporation_date: "",
      registered_address: "",
      operating_address: "",
      tin: "",
      annual_turnover_range: "",
      website: "",
      contact_person: "",
      contact_phone: "",
      contact_email: "",
    },
    directors: [],
    documents: [],
    consent: false,
  };
}

export type StepKey = "type" | "details" | "directors" | "documents" | "review";

export function stepsFor(type: ClientType): { key: StepKey; label: string }[] {
  return [
    { key: "type", label: "Type" },
    { key: "details", label: "Details" },
    ...(type === "company" ? [{ key: "directors" as const, label: "Directors" }] : []),
    { key: "documents", label: "Documents" },
    { key: "review", label: "Review" },
  ];
}

/** "Adaeze N. Okafor" from raw person values. */
export function personName(
  p: Pick<PersonInput, "first_name" | "middle_name" | "last_name">,
): string {
  const middle = p.middle_name?.trim() ? ` ${p.middle_name.trim()[0]}.` : "";
  return `${p.first_name.trim()}${middle} ${p.last_name.trim()}`.trim();
}
