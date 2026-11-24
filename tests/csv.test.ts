import { describe, expect, it } from "vitest";

import { csvCell, csvFileName, toCsv } from "@/lib/export/csv";

describe("csvCell", () => {
  it("quotes commas, quotes and line breaks", () => {
    expect(csvCell("Okeke, Sons")).toBe('"Okeke, Sons"');
    expect(csvCell('6" pipes')).toBe('"6"" pipes"');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralises formulas but keeps negative amounts numeric", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("+2348031234567")).toBe("'+2348031234567");
    expect(csvCell("-1500.00")).toBe("-1500.00");
  });

  it("writes empty cells for null and undefined", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });
});

describe("toCsv", () => {
  it("joins header and rows with CRLF", () => {
    expect(
      toCsv(
        ["Name", "Amount"],
        [
          ["A", "10.00"],
          ["B, Ltd", null],
        ],
      ),
    ).toBe('Name,Amount\r\nA,10.00\r\n"B, Ltd",');
  });
});

describe("csvFileName", () => {
  it("uses the Lagos date", () => {
    // 23:30 UTC on 23 Nov is 00:30 on 24 Nov in Lagos (UTC+1)
    expect(csvFileName("financiers", new Date("2026-11-23T23:30:00Z"))).toBe(
      "financiers-2026-11-24.csv",
    );
  });
});
