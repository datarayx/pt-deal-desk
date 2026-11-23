import { describe, expect, it } from "vitest";

import { formatNaira, isNegativeMoney } from "@/lib/format/money";

describe("formatNaira", () => {
  it("formats naira with en-NG grouping and kobo", () => {
    expect(formatNaira("1250000")).toBe("₦1,250,000.00");
    expect(formatNaira(1250000)).toBe("₦1,250,000.00");
  });

  it("keeps full precision for large decimal strings (numeric(18,2))", () => {
    expect(formatNaira("9999999999999999.99")).toBe("₦9,999,999,999,999,999.99");
  });

  it("rounds decimal strings half-up exactly, unlike floats", () => {
    expect(formatNaira("2.675")).toBe("₦2.68");
  });

  it("shows negatives with a minus sign", () => {
    expect(formatNaira("-12.5")).toBe("-₦12.50");
  });

  it("never shows a negative zero", () => {
    expect(formatNaira("-0.004")).toBe("₦0.00");
    expect(formatNaira(-0)).toBe("₦0.00");
  });

  it("supports compact notation for KPI cards", () => {
    expect(formatNaira("1250000000", { compact: true })).toBe("₦1.25B");
    expect(formatNaira("450000000", { compact: true })).toBe("₦450M");
  });

  it("returns null for invalid input", () => {
    expect(formatNaira("abc")).toBeNull();
    expect(formatNaira("1,000")).toBeNull();
    expect(formatNaira(Number.NaN)).toBeNull();
    expect(formatNaira("")).toBeNull();
  });
});

describe("isNegativeMoney", () => {
  it("is true only for values below zero after rounding to kobo", () => {
    expect(isNegativeMoney("-1")).toBe(true);
    expect(isNegativeMoney("-0.004")).toBe(false);
    expect(isNegativeMoney("0")).toBe(false);
    expect(isNegativeMoney("15")).toBe(false);
  });
});
