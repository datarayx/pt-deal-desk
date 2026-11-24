import { describe, expect, it } from "vitest";

import { formatRate, formatRateRange } from "@/lib/format/rate";

describe("formatRate", () => {
  it("drops trailing zeros from numeric(6,3)", () => {
    expect(formatRate("4.700")).toBe("4.7%");
    expect(formatRate("5.000")).toBe("5%");
    expect(formatRate(6.125)).toBe("6.125%");
    expect(formatRate(null)).toBeNull();
    expect(formatRate("")).toBeNull();
  });
});

describe("formatRateRange", () => {
  it("always says per month", () => {
    expect(formatRateRange("4.7", "6")).toBe("4.7%–6% per month");
    expect(formatRateRange("5", "5")).toBe("5% per month");
    expect(formatRateRange("5", null)).toBe("from 5% per month");
    expect(formatRateRange(null, "8")).toBe("up to 8% per month");
    expect(formatRateRange(null, null)).toBeNull();
  });
});
