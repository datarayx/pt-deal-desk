import { describe, expect, it } from "vitest";

import { commandFilter } from "@/lib/command-filter";

describe("commandFilter", () => {
  it("shows everything for an empty search", () => {
    expect(commandFilter("Deals", "")).toBe(1);
  });

  it("matches word prefixes", () => {
    expect(commandFilter("action Run trial balance", "trial")).toBeGreaterThan(0);
    expect(commandFilter("Finance Reports trial balance profit or loss", "profit")).toBeGreaterThan(
      0,
    );
  });

  it("does not fuzzy-match scattered letters", () => {
    expect(commandFilter("Partners Financiers banks finance houses lenders", "trial")).toBe(0);
    expect(commandFilter("Settings Company profile branding logo letterhead", "trial")).toBe(0);
  });

  it("requires every typed word to match", () => {
    expect(commandFilter("action Record a reported repayment", "rec rep")).toBeGreaterThan(0);
    expect(commandFilter("action Record a reported repayment", "rec deal")).toBe(0);
  });

  it("matches keywords passed separately", () => {
    expect(
      commandFilter("Finance Journals", "manual", ["journal entry", "manual journal"]),
    ).toBeGreaterThan(0);
  });

  it("ranks a phrase at the start above a later match", () => {
    expect(commandFilter("deals pipeline", "deals")).toBeGreaterThan(
      commandFilter("action New deal deals", "deals"),
    );
  });
});
