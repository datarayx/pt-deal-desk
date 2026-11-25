import { describe, expect, it } from "vitest";

import { definitionFor } from "@/features/imports/catalog";
import { previewRows, validateWorkbook, type ImportSheetData } from "@/features/imports/logic";

describe("bulk import validation", () => {
  it("requires every template sheet and required column", () => {
    const definition = definitionFor("accounting");
    const sheets: ImportSheetData[] = [{ name: "journals", headers: ["external_id"], rows: [{}] }];
    const errors = validateWorkbook(definition, sheets);
    expect(errors.some((error) => error.errors.includes("Missing required column: entry_date."))).toBe(true);
    expect(errors.some((error) => error.sheet === "accounts" && error.errors.includes("This sheet is required."))).toBe(true);
  });

  it("reports missing required cells and keeps a bounded preview", () => {
    const definition = definitionFor("partners");
    const sheets: ImportSheetData[] = definition.sheets.map((sheet) => ({
      name: sheet.name,
      headers: sheet.columns,
      rows: sheet.name === "referrers" ? [{ external_id: "R-1", name: "", referrer_type: "consultant" }] : [],
    }));
    const errors = validateWorkbook(definition, sheets);
    expect(errors.some((error) => error.sheet === "referrers" && error.row === 2)).toBe(true);
    expect(previewRows(sheets, 1)).toHaveLength(1);
  });
});

