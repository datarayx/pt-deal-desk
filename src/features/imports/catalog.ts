export type ImportDomain =
  | "partners"
  | "clients"
  | "deals"
  | "repayments"
  | "accounting";

export type ImportMode = "historical" | "live";

export type ImportSheet = {
  name: string;
  required: string[];
  columns: string[];
  help: string;
};

export type ImportDefinition = {
  domain: ImportDomain;
  label: string;
  description: string;
  roles: readonly ("ceo" | "accountant")[];
  sheets: ImportSheet[];
  historicalWarning: string;
};

export const importDefinitions: ImportDefinition[] = [
  {
    domain: "partners",
    label: "Partners",
    description: "Referrers, financiers and their requirement checklists.",
    roles: ["ceo"],
    sheets: [
      {
        name: "referrers",
        required: ["external_id", "name", "referrer_type"],
        columns: [
          "external_id",
          "name",
          "referrer_type",
          "contact_person",
          "phone",
          "email",
          "default_fee_type",
          "default_fee_value",
          "bank_name",
          "account_name",
        ],
        help: "One referrer per row. external_id must be unique in this workbook.",
      },
      {
        name: "financiers",
        required: ["external_id", "name", "financier_type"],
        columns: [
          "external_id",
          "name",
          "financier_type",
          "contact_person",
          "phone",
          "email",
          "rate_min_monthly",
          "rate_max_monthly",
          "facility_types",
          "collateral_policy",
          "notes",
        ],
        help: "Separate facility types with semicolons, for example: LPO financing;Working capital.",
      },
      {
        name: "financier_requirements",
        required: ["financier_external_id", "item", "is_required"],
        columns: ["financier_external_id", "item", "is_required", "sort_order"],
        help: "Checklist rows refer to financiers by external_id.",
      },
    ],
    historicalWarning: "Partner imports create directory records and do not create deals or fees.",
  },
  {
    domain: "clients",
    label: "Clients and KYC",
    description: "Clients, people, directors, KYC documents, credit checks and exposures.",
    roles: ["ceo"],
    sheets: [
      {
        name: "clients",
        required: ["external_id", "client_type", "display_name", "enquiry_source", "consent"],
        columns: [
          "external_id",
          "client_type",
          "display_name",
          "enquiry_source",
          "referrer_external_id",
          "sector",
          "notes",
          "consent",
          "first_name",
          "middle_name",
          "last_name",
          "gender",
          "date_of_birth",
          "phone",
          "email",
          "residential_address",
          "state",
          "lga",
          "occupation",
          "employer_or_business",
          "monthly_income_range",
          "bvn",
          "nin",
          "id_type",
          "id_number",
          "id_expiry",
          "next_of_kin_name",
          "next_of_kin_phone",
          "next_of_kin_relationship",
          "is_pep",
          "registered_name",
          "company_type",
          "rc_number",
          "incorporation_date",
          "registered_address",
          "operating_address",
          "tin",
          "annual_turnover_range",
          "website",
          "contact_person",
          "contact_phone",
          "contact_email",
        ],
        help: "Use the individual columns for individuals and company columns for companies. Leave the other set blank.",
      },
      {
        name: "directors",
        required: ["client_external_id", "role", "shareholding_pct", "first_name", "last_name"],
        columns: [
          "client_external_id",
          "role",
          "shareholding_pct",
          "title",
          "first_name",
          "middle_name",
          "last_name",
          "gender",
          "date_of_birth",
          "phone",
          "email",
          "residential_address",
          "state",
          "lga",
          "occupation",
          "employer_or_business",
          "monthly_income_range",
          "bvn",
          "nin",
          "id_type",
          "id_number",
          "id_expiry",
          "next_of_kin_name",
          "next_of_kin_phone",
          "next_of_kin_relationship",
          "is_pep",
        ],
        help: "Each row links to a company using client_external_id. BVN or NIN is required.",
      },
      {
        name: "documents",
        required: ["client_external_id", "document_type_name", "file_path"],
        columns: ["client_external_id", "person_external_id", "document_type_name", "file_path", "expiry_date"],
        help: "Upload files to the private KYC bucket separately, then use the exact storage path here.",
      },
      {
        name: "credit_checks",
        required: ["client_external_id", "bureau", "check_date"],
        columns: ["client_external_id", "bureau", "check_date", "rating", "score", "total_exposure", "delinquent_facilities", "remarks", "report_file_path"],
        help: "Credit reports are separate files. Use report_file_path only after the file is in storage.",
      },
      {
        name: "exposures",
        required: ["client_external_id", "lender_name", "amount", "outstanding", "status"],
        columns: ["client_external_id", "lender_name", "facility_type", "amount", "outstanding", "status"],
        help: "One external lender exposure per row.",
      },
    ],
    historicalWarning: "Historical client imports do not create alerts. KYC documents remain unverified until a CEO verifies them.",
  },
  {
    domain: "deals",
    label: "Deals",
    description: "Deals, requirements, stage history, activities and fee terms.",
    roles: ["ceo"],
    sheets: [
      {
        name: "deals",
        required: ["external_id", "reference", "client_external_id", "financier_external_id", "facility_type_name", "amount_requested"],
        columns: ["external_id", "reference", "client_external_id", "financier_external_id", "facility_type_name", "referrer_external_id", "amount_requested", "amount_approved", "amount_disbursed", "tenor_months", "interest_rate_monthly", "purpose", "collateral_type", "collateral_value", "guarantor_name", "guarantor_cheques", "other_fees_note", "offer_date", "disbursement_date", "first_repayment_date", "maturity_date", "repayment_frequency", "stage_name", "outcome", "decline_reason"],
        help: "References use external IDs from the related sheets. Historical mode will not recognise fees automatically.",
      },
      {
        name: "deal_requirements",
        required: ["deal_external_id", "item", "status"],
        columns: ["deal_external_id", "item", "is_required", "status", "file_path"],
        help: "Requirement status is pending, received or waived.",
      },
      {
        name: "activities",
        required: ["entity_type", "entity_external_id", "kind", "body", "occurred_at"],
        columns: ["entity_type", "entity_external_id", "kind", "body", "occurred_at"],
        help: "Activity rows are linked by the external ID of the client, deal or referrer.",
      },
    ],
    historicalWarning: "Historical deals are loaded without disbursement automation; imported schedules and accounting entries remain explicit.",
  },
  {
    domain: "repayments",
    label: "Repayments",
    description: "Existing schedules and historical reported or confirmed payments.",
    roles: ["ceo"],
    sheets: [
      {
        name: "schedules",
        required: ["deal_external_id", "instalment_no", "due_date", "principal_due", "interest_due", "total_due", "status"],
        columns: ["deal_external_id", "instalment_no", "due_date", "principal_due", "interest_due", "total_due", "status", "days_overdue"],
        help: "Use this for existing schedules. It avoids regenerating a historical schedule with different terms.",
      },
      {
        name: "payments",
        required: ["deal_external_id", "instalment_no", "amount", "paid_on", "channel", "status"],
        columns: ["deal_external_id", "instalment_no", "amount", "paid_on", "channel", "status", "proof_file_path", "confirmed_at", "confirmation_note"],
        help: "Payments are imported as historical reports; proof files must already be in private storage.",
      },
    ],
    historicalWarning: "Historical repayments do not re-run first-repayment fee recognition or reminder jobs.",
  },
  {
    domain: "accounting",
    label: "Accounting",
    description: "Chart of accounts, opening balances and historical double-entry journals.",
    roles: ["ceo", "accountant"],
    sheets: [
      {
        name: "accounts",
        required: ["code", "name", "type"],
        columns: ["code", "name", "type", "subtype", "parent_code", "is_active"],
        help: "System account codes cannot be overwritten. Use journals for opening balances.",
      },
      {
        name: "journals",
        required: ["external_id", "entry_date", "memo"],
        columns: ["external_id", "entry_date", "reference", "memo"],
        help: "One journal header per row. Each header must have matching rows in journal_lines.",
      },
      {
        name: "journal_lines",
        required: ["journal_external_id", "account_code", "debit", "credit"],
        columns: ["journal_external_id", "account_code", "debit", "credit", "description"],
        help: "Every journal must balance. Use either debit or credit on each line, never both.",
      },
    ],
    historicalWarning: "Historical journals are posted as imported entries and do not create fee triggers.",
  },
];

export function definitionFor(domain: ImportDomain) {
  return importDefinitions.find((definition) => definition.domain === domain)!;
}

