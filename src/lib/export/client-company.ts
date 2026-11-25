import type { ExportCompany } from "@/lib/export/types";

const fallbackCompany: ExportCompany = {
  companyName: "P&T Finance Consult Limited",
  companyAddress: null,
  companyEmail: null,
  companyPhone: null,
  companyWebsite: null,
  companyRcNumber: null,
  companyTin: null,
  companyLogoDataUrl: null,
};

export async function getClientExportCompany(): Promise<ExportCompany> {
  let response: Response;
  try {
    response = await fetch("/api/export/company-profile", {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error("Company profile could not be loaded for this export.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("application/json")) {
    throw new Error("Company profile could not be loaded for this export.");
  }

  try {
    const payload = (await response.json()) as Partial<ExportCompany>;
    if (typeof payload.companyName !== "string" || payload.companyName.trim() === "") {
      throw new Error("Company profile is incomplete.");
    }
    return { ...fallbackCompany, ...payload };
  } catch {
    throw new Error("Company profile could not be loaded for this export.");
  }
}

export function mergeExportCompany(
  table: { [key: string]: unknown },
  company: ExportCompany,
) {
  return {
    ...company,
    ...table,
  };
}

