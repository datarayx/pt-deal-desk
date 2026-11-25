import { describe, expect, it, vi } from "vitest";

import { getClientExportCompany, mergeExportCompany } from "@/lib/export/client-company";

describe("export company handoff", () => {
  it("keeps the logo and company details returned by the authenticated profile endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            companyName: "P&T Finance Consult Limited",
            companyAddress: "Lagos",
            companyLogoDataUrl: "data:image/png;base64,logo",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    await expect(getClientExportCompany()).resolves.toMatchObject({
      companyName: "P&T Finance Consult Limited",
      companyAddress: "Lagos",
      companyLogoDataUrl: "data:image/png;base64,logo",
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/export/company-profile",
      expect.objectContaining({ credentials: "same-origin", cache: "no-store" }),
    );
    vi.unstubAllGlobals();
  });

  it("refuses to generate an unbranded export when the profile request is redirected or fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<!doctype html><title>Sign in</title>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      ),
    );

    await expect(getClientExportCompany()).rejects.toThrow("Company profile could not be loaded");
    vi.unstubAllGlobals();
  });

  it("preserves branding when the table data is merged", () => {
    const company = {
      companyName: "P&T Finance Consult Limited",
      companyAddress: "Lagos",
      companyEmail: null,
      companyPhone: null,
      companyWebsite: null,
      companyRcNumber: null,
      companyTin: null,
      companyLogoDataUrl: "data:image/png;base64,logo",
    };

    expect(mergeExportCompany({ title: "Clients", rows: [] }, company)).toMatchObject({
      companyName: company.companyName,
      companyLogoDataUrl: company.companyLogoDataUrl,
    });
  });
});

