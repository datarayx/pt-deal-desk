// Fixed choices for client forms and labels for client enums (DATA_MODEL.md "Clients & KYC").

export const CLIENT_TYPES = ["company", "individual"] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];
export const clientTypeLabel: Record<ClientType, string> = {
  company: "Company",
  individual: "Individual",
};

export const ENQUIRY_SOURCES = [
  "referral",
  "email",
  "whatsapp",
  "phone",
  "walk_in",
  "website",
] as const;
export type EnquirySource = (typeof ENQUIRY_SOURCES)[number];
export const enquirySourceLabel: Record<EnquirySource, string> = {
  referral: "Referral",
  email: "Email",
  whatsapp: "WhatsApp",
  phone: "Phone call",
  walk_in: "Walk-in",
  website: "Website",
};

export const COMPANY_TYPES = ["ltd", "plc", "bn", "ngo"] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];
export const companyTypeLabel: Record<CompanyType, string> = {
  ltd: "Private limited company (Ltd)",
  plc: "Public limited company (Plc)",
  bn: "Business name (BN)",
  ngo: "Incorporated trustees / NGO (IT)",
};

export const DIRECTOR_ROLES = ["director", "director_shareholder", "shareholder"] as const;
export type DirectorRole = (typeof DIRECTOR_ROLES)[number];
export const directorRoleLabel: Record<DirectorRole, string> = {
  director: "Director",
  director_shareholder: "Director & shareholder",
  shareholder: "Shareholder",
};

export const GENDERS = ["female", "male"] as const;
export const genderLabel = { female: "Female", male: "Male" } as const;

export const TITLES = [
  "Mr",
  "Mrs",
  "Ms",
  "Miss",
  "Dr",
  "Chief",
  "Alhaji",
  "Alhaja",
  "Engr",
  "Prof",
  "Arc",
  "Barr",
] as const;

export const ID_TYPES = [
  "NIN slip / NIMC card",
  "International passport",
  "Driver's licence",
  "Permanent voter's card",
] as const;

export const INCOME_RANGES = [
  "Below ₦250,000",
  "₦250,000 – ₦1,000,000",
  "₦1,000,000 – ₦5,000,000",
  "₦5,000,000 – ₦20,000,000",
  "Above ₦20,000,000",
] as const;

export const TURNOVER_RANGES = [
  "Below ₦25m",
  "₦25m – ₦100m",
  "₦100m – ₦500m",
  "₦500m – ₦1bn",
  "₦1bn – ₦5bn",
  "Above ₦5bn",
] as const;

/** Suggestions only — the sector field accepts any text. */
export const SECTORS = [
  "Mining",
  "Real estate",
  "Agro-processing",
  "Agriculture",
  "LPO contracting",
  "Construction",
  "Oil & gas services",
  "Manufacturing",
  "Logistics",
  "Trading",
  "Healthcare",
  "Education",
  "Technology",
  "Hospitality",
] as const;

export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT (Abuja)",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

/** "*******1234" — the only form BVN/NIN take outside the client's own profile page. */
export function maskId(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\s/g, "");
  return digits.length <= 4
    ? "*".repeat(digits.length)
    : `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
}
