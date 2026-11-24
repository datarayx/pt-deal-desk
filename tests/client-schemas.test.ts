import { describe, expect, it } from "vitest";

import { maskId } from "@/features/clients/options";
import { directorSchema, individualSchema, newClientSchema } from "@/features/clients/schemas";
import { ageInYears, normaliseCacNumber } from "@/lib/validation";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const person = (over: Record<string, unknown> = {}) => ({
  id: uuid(1),
  title: "",
  first_name: "Adaeze",
  middle_name: "",
  last_name: "Okafor",
  gender: "female",
  date_of_birth: "1985-04-12",
  phone: "0803 123 4567",
  email: "",
  residential_address: "12 Adeola Odeku St, Victoria Island",
  state: "Lagos",
  lga: "Eti-Osa",
  occupation: "",
  employer_or_business: "",
  monthly_income_range: "",
  bvn: "222 1234 5678",
  nin: "",
  id_type: "",
  id_number: "",
  id_expiry: "",
  next_of_kin_name: "",
  next_of_kin_phone: "",
  next_of_kin_relationship: "",
  is_pep: false,
  ...over,
});

const company = (over: Record<string, unknown> = {}) => ({
  registered_name: "Zuma Rock Minerals Ltd",
  company_type: "ltd",
  rc_number: "rc1234567",
  incorporation_date: "2015-06-01",
  registered_address: "Plot 4, Abuja",
  operating_address: "",
  tin: "",
  annual_turnover_range: "",
  website: "",
  contact_person: "Musa Bello",
  contact_phone: "08031234567",
  contact_email: "",
  ...over,
});

const director = (n: number, over: Record<string, unknown> = {}) => ({
  profile: person({ id: uuid(10 + n), bvn: `2220000000${n}` }),
  role: "director_shareholder",
  shareholding_pct: "50",
  ...over,
});

const base = {
  id: uuid(99),
  enquiry_source: "email",
  referrer_id: "",
  sector: "",
  notes: "",
  documents: [],
  consent: true,
};

describe("Nigerian formats", () => {
  it("normalises CAC numbers by company type", () => {
    expect(normaliseCacNumber("rc-1234567", "ltd")).toEqual({ ok: true, value: "RC 1234567" });
    expect(normaliseCacNumber("1234567", "bn")).toEqual({ ok: true, value: "BN 1234567" });
    expect(normaliseCacNumber("IT 99", "ngo")).toEqual({ ok: true, value: "IT 99" });
    expect(normaliseCacNumber("BN 123", "ltd").ok).toBe(false);
    expect(normaliseCacNumber("ABC", "ltd").ok).toBe(false);
    expect(normaliseCacNumber("", "ltd")).toEqual({ ok: true, value: null });
  });

  it("parses phone and BVN, requires 11 digits", () => {
    const ok = individualSchema.parse(person());
    expect(ok.phone).toBe("+2348031234567");
    expect(ok.bvn).toBe("22212345678");
    expect(individualSchema.safeParse(person({ bvn: "1234" })).success).toBe(false);
    expect(individualSchema.safeParse(person({ nin: "123456789012" })).success).toBe(false);
    expect(individualSchema.safeParse(person({ phone: "+44 20 7946 0000" })).success).toBe(false);
  });

  it("requires adults and masks IDs", () => {
    expect(ageInYears("2000-11-24", new Date("2026-11-24T12:00:00Z"))).toBe(26);
    expect(ageInYears("2000-11-25", new Date("2026-11-24T12:00:00Z"))).toBe(25);
    expect(individualSchema.safeParse(person({ date_of_birth: "2015-01-01" })).success).toBe(false);
    expect(maskId("22212345678")).toBe("*******5678");
    expect(maskId(null)).toBeNull();
  });
});

describe("directors", () => {
  it("needs a BVN or NIN and a shareholding for shareholders", () => {
    expect(
      directorSchema.safeParse(director(1, { profile: person({ bvn: "", nin: "" }) })).success,
    ).toBe(false);
    expect(directorSchema.safeParse(director(1, { shareholding_pct: "" })).success).toBe(false);
    expect(
      directorSchema.safeParse(director(1, { role: "director", shareholding_pct: "" })).success,
    ).toBe(true);
  });
});

describe("newClientSchema", () => {
  it("accepts a company with directors and normalises its RC number", () => {
    const parsed = newClientSchema.parse({
      ...base,
      client_type: "company",
      company: company(),
      directors: [director(1), director(2)],
    });
    expect(parsed.client_type === "company" && parsed.company.rc_number).toBe("RC 1234567");
  });

  it("rejects shareholdings over 100% and the same person twice", () => {
    expect(
      newClientSchema.safeParse({
        ...base,
        client_type: "company",
        company: company(),
        directors: [
          director(1, { shareholding_pct: "70" }),
          director(2, { shareholding_pct: "40" }),
        ],
      }).success,
    ).toBe(false);
    expect(
      newClientSchema.safeParse({
        ...base,
        client_type: "company",
        company: company(),
        directors: [director(1), director(1)],
      }).success,
    ).toBe(false);
  });

  it("needs a referrer for referrals, at least one director, and consent", () => {
    expect(
      newClientSchema.safeParse({
        ...base,
        enquiry_source: "referral",
        client_type: "individual",
        individual: person(),
      }).success,
    ).toBe(false);
    expect(
      newClientSchema.safeParse({
        ...base,
        client_type: "company",
        company: company(),
        directors: [],
      }).success,
    ).toBe(false);
    expect(
      newClientSchema.safeParse({
        ...base,
        consent: false,
        client_type: "individual",
        individual: person(),
      }).success,
    ).toBe(false);
    expect(
      newClientSchema.safeParse({ ...base, client_type: "individual", individual: person() })
        .success,
    ).toBe(true);
  });
});
