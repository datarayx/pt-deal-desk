import { describe, expect, it } from "vitest";

import { formatDate, toDateTimeAttribute } from "@/lib/format/date";

describe("formatDate", () => {
  it("formats calendar dates as '23 Nov 2026' without timezone shifts", () => {
    expect(formatDate("2026-11-23")).toBe("23 Nov 2026");
    expect(formatDate("2026-01-01")).toBe("1 Jan 2026");
  });

  it("shows instants as the Africa/Lagos day (UTC+1)", () => {
    // 23:30 UTC on 23 Nov is 00:30 on 24 Nov in Lagos
    expect(formatDate("2026-11-23T23:30:00Z")).toBe("24 Nov 2026");
    expect(formatDate(new Date("2026-11-23T10:00:00Z"))).toBe("23 Nov 2026");
  });

  it("adds Lagos time on request", () => {
    expect(formatDate("2026-11-23T13:05:00Z", { withTime: true })).toBe("23 Nov 2026, 14:05");
  });

  it("ignores withTime for calendar dates", () => {
    expect(formatDate("2026-11-23", { withTime: true })).toBe("23 Nov 2026");
  });

  it("returns null for invalid input", () => {
    expect(formatDate("not a date")).toBeNull();
  });
});

describe("toDateTimeAttribute", () => {
  it("keeps calendar dates and converts instants to ISO", () => {
    expect(toDateTimeAttribute("2026-11-23")).toBe("2026-11-23");
    expect(toDateTimeAttribute("2026-11-23T13:05:00+01:00")).toBe("2026-11-23T12:05:00.000Z");
  });
});
