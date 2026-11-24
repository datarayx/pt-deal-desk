import { z } from "zod";

import {
  COMPANY_TYPES,
  DIRECTOR_ROLES,
  ENQUIRY_SOURCES,
  GENDERS,
} from "@/features/clients/options";
import {
  ageInYears,
  elevenDigits,
  lagosToday,
  nairaAmount,
  nigerianPhone,
  normaliseCacNumber,
  optionalDate,
  optionalEmail,
  optionalPercent,
  optionalText,
  requiredText,
} from "@/lib/validation";

// New Client wizard (task 2.4). One schema shared by the browser (step-by-step validation) and
// the Server Action (re-validated before create_client runs). Form values are strings; blanks
// become null. The database re-checks every format as a backstop.

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.union([z.literal("").transform(() => null), z.enum(values)]);

const notFuture = (label: string) =>
  optionalDate(label).refine(
    (v) => v === null || v <= lagosToday(),
    `${label} can't be in the future.`,
  );

/** Fields for one person: the individual client, or a director/shareholder. */
const personFields = {
  id: z.uuid(),
  title: optionalText(20),
  first_name: requiredText(80, "First name"),
  middle_name: optionalText(80),
  last_name: requiredText(80, "Surname"),
  gender: optionalEnum(GENDERS),
  date_of_birth: notFuture("Date of birth"),
  phone: nigerianPhone,
  email: optionalEmail,
  residential_address: optionalText(400),
  state: optionalText(60),
  lga: optionalText(80),
  occupation: optionalText(120),
  employer_or_business: optionalText(200),
  monthly_income_range: optionalText(60),
  bvn: elevenDigits("BVN"),
  nin: elevenDigits("NIN"),
  id_type: optionalText(60),
  id_number: optionalText(60),
  id_expiry: optionalDate("ID expiry"),
  next_of_kin_name: optionalText(160),
  next_of_kin_phone: nigerianPhone,
  next_of_kin_relationship: optionalText(60),
  is_pep: z.boolean(),
};

type PersonOut = z.output<z.ZodObject<typeof personFields>>;

function checkAdult(v: PersonOut, ctx: z.RefinementCtx) {
  if (v.date_of_birth && ageInYears(v.date_of_birth) < 18) {
    ctx.addIssue({
      code: "custom",
      path: ["date_of_birth"],
      message: "Must be at least 18 years old.",
    });
  }
}

/** The individual client: BVN, phone and date of birth are required for KYC. */
export const individualSchema = z.object(personFields).superRefine((v, ctx) => {
  if (!v.bvn) ctx.addIssue({ code: "custom", path: ["bvn"], message: "BVN is required." });
  if (!v.phone) ctx.addIssue({ code: "custom", path: ["phone"], message: "Phone is required." });
  if (!v.date_of_birth) {
    ctx.addIssue({
      code: "custom",
      path: ["date_of_birth"],
      message: "Date of birth is required.",
    });
  }
  if (!v.residential_address) {
    ctx.addIssue({
      code: "custom",
      path: ["residential_address"],
      message: "Address is required.",
    });
  }
  checkAdult(v, ctx);
});

/** A director or shareholder: identified by BVN or NIN so the same person is never filed twice. */
export const directorSchema = z
  .object({
    profile: z.object(personFields).superRefine((v, ctx) => {
      if (!v.bvn && !v.nin) {
        ctx.addIssue({ code: "custom", path: ["bvn"], message: "Enter a BVN or NIN." });
      }
      checkAdult(v, ctx);
    }),
    role: z.enum(DIRECTOR_ROLES),
    shareholding_pct: optionalPercent("Shareholding"),
    /** Set when the BVN/NIN matched someone already on file (display only). */
    linked_name: z.string().max(200).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.role !== "director" && v.shareholding_pct === null) {
      ctx.addIssue({
        code: "custom",
        path: ["shareholding_pct"],
        message: "Enter the shareholding.",
      });
    }
  });
export type DirectorInput = z.input<typeof directorSchema>;

export const companySchema = z
  .object({
    registered_name: requiredText(200, "Registered name"),
    company_type: z.enum(COMPANY_TYPES),
    rc_number: z.string().trim().max(20),
    incorporation_date: notFuture("Incorporation date"),
    registered_address: requiredText(400, "Registered address"),
    operating_address: optionalText(400),
    tin: z
      .string()
      .trim()
      .pipe(
        z.union([
          z.literal(""),
          z.string().regex(/^[0-9-]{8,20}$/, "TIN is 8–20 digits, e.g. 12345678-0001."),
        ]),
      )
      .transform((v) => (v === "" ? null : v)),
    annual_turnover_range: optionalText(60),
    website: optionalText(200),
    contact_person: requiredText(160, "Contact person"),
    contact_phone: nigerianPhone,
    contact_email: optionalEmail,
  })
  .superRefine((v, ctx) => {
    const cac = normaliseCacNumber(v.rc_number, v.company_type);
    if (!cac.ok) ctx.addIssue({ code: "custom", path: ["rc_number"], message: cac.error });
    else if (!cac.value) {
      ctx.addIssue({ code: "custom", path: ["rc_number"], message: "CAC number is required." });
    }
    if (!v.contact_phone) {
      ctx.addIssue({
        code: "custom",
        path: ["contact_phone"],
        message: "Contact phone is required.",
      });
    }
  })
  .transform((v) => {
    const cac = normaliseCacNumber(v.rc_number, v.company_type);
    return { ...v, rc_number: cac.ok ? cac.value : null };
  });

export const documentSchema = z.object({
  document_type_id: z.uuid(),
  /** null = the client itself; otherwise a director's profile id. */
  person_id: z.uuid().nullable(),
  file_path: z
    .string()
    .regex(/^[A-Za-z0-9/_.\-]+$/)
    .max(300),
  file_name: z.string().max(255),
  expiry_date: optionalDate("Expiry date"),
});
export type DocumentInput = z.input<typeof documentSchema>;

export const directorsSchema = z
  .array(directorSchema)
  .min(1, "Add at least one director.")
  .max(50)
  .superRefine((dirs, ctx) => {
    const total = dirs.reduce((sum, d) => sum + Number(d.shareholding_pct ?? 0), 0);
    if (total > 100.0001) {
      ctx.addIssue({
        code: "custom",
        message: `Shareholdings add up to ${total}%, more than 100%.`,
      });
    }
    const seen = new Set<string>();
    for (const d of dirs) {
      for (const key of [
        d.profile.bvn && `b${d.profile.bvn}`,
        d.profile.nin && `n${d.profile.nin}`,
      ]) {
        if (!key) continue;
        if (seen.has(key)) {
          ctx.addIssue({ code: "custom", message: "The same person is listed twice." });
          return;
        }
        seen.add(key);
      }
    }
  });

const common = {
  id: z.uuid(),
  enquiry_source: z.enum(ENQUIRY_SOURCES, "Choose how they found P&T."),
  referrer_id: z.union([z.literal("").transform(() => null), z.uuid()]),
  sector: optionalText(120),
  notes: optionalText(2000),
  documents: z.array(documentSchema).max(200),
  consent: z.boolean().refine((v) => v, "Confirm the client agreed to P&T processing their data."),
};

export const newClientSchema = z
  .discriminatedUnion("client_type", [
    z.object({ ...common, client_type: z.literal("individual"), individual: individualSchema }),
    z.object({
      ...common,
      client_type: z.literal("company"),
      company: companySchema,
      directors: directorsSchema,
    }),
  ])
  .superRefine((v, ctx) => {
    if (v.enquiry_source === "referral" && !v.referrer_id) {
      ctx.addIssue({ code: "custom", path: ["referrer_id"], message: "Choose who referred them." });
    }
  });
export type NewClientInput = z.input<typeof newClientSchema>;
export type NewClientOutput = z.output<typeof newClientSchema>;

const nullableAmount = z
  .union([z.literal(""), nairaAmount])
  .transform((v) => (v === "" ? null : v));

export const clientDocumentUpdateSchema = z.object({
  client_id: z.uuid(),
  document_id: z.uuid(),
  expiry_date: optionalDate("Expiry date"),
});

export const clientDocumentUploadSchema = clientDocumentUpdateSchema.extend({
  file_path: z
    .string()
    .regex(/^[A-Za-z0-9/_.\-]+$/)
    .max(300),
});

export const creditCheckSchema = z.object({
  client_id: z.uuid(),
  bureau: z.enum(["CRC", "FirstCentral", "CreditRegistry", "Other"]),
  check_date: z.iso.date("Enter a valid check date."),
  rating: optionalText(40),
  score: z
    .union([z.literal(""), z.string().regex(/^\d{1,4}$/, "Score must be a whole number.")])
    .transform((v) => (v === "" ? null : Number(v))),
  total_exposure: nullableAmount,
  delinquent_facilities: z
    .string()
    .regex(/^\d{1,3}$/, "Enter a whole number.")
    .transform(Number),
  remarks: optionalText(2000),
  report_file_path: z
    .union([
      z.literal(""),
      z
        .string()
        .regex(/^[A-Za-z0-9/_.\-]+$/)
        .max(300),
    ])
    .transform((v) => (v === "" ? null : v)),
  exposures: z
    .array(
      z.object({
        lender_name: requiredText(160, "Lender name"),
        facility_type: optionalText(120),
        amount: nairaAmount,
        outstanding: nairaAmount,
        status: z.enum(["active", "closed", "delinquent"]),
      }),
    )
    .max(50),
});
