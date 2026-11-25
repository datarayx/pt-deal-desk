import { describe, expect, it } from "vitest";

import { excelExportCell, isNegativeExportCell, pdfExportCell } from "@/lib/export/format";

describe("accounting export formatting", () => {
  it("detects negative numeric values without treating text as numbers", () => {
    expect(isNegativeExportCell("-150000.00")).toBe(true);
    expect(isNegativeExportCell(-150000)).toBe(true);
    expect(isNegativeExportCell("150000.00")).toBe(false);
    expect(isNegativeExportCell("ACC-150000")).toBe(false);
  });

  it("uses accounting parentheses in PDF output", () => {
    expect(pdfExportCell("-150000.00")).toBe("(150000.00)");
    expect(pdfExportCell("150000.00")).toBe("150000.00");
    expect(pdfExportCell(null)).toBe("");
  });

  it("keeps negative Excel values numeric for number formatting", () => {
    expect(excelExportCell("-150000.00")).toBe(-150000);
    expect(excelExportCell("Account 150000")).toBe("Account 150000");
  });
});

