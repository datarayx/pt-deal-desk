import { describe, expect, it } from "vitest";

import { monthRange, percentageDelta, previousMonth } from "@/features/dashboard/logic";

describe("dashboard periods and KPI deltas", () => {
  it("calculates a previous calendar month", () => {
    const current = monthRange("2026-01-24");
    expect(previousMonth(current)).toMatchObject({ from: "2025-12-01", to: "2025-12-31" });
  });

  it("compares KPI values with a signed last-month percentage", () => {
    expect(percentageDelta("120.00", "100.00")).toMatchObject({ value: "+20%", trend: "up" });
    expect(percentageDelta("80", "100")).toMatchObject({ value: "-20%", trend: "down" });
    expect(percentageDelta("10", "0")).toMatchObject({ value: "New", trend: "up" });
  });
});
