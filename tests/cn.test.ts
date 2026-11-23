import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("keeps text colour alongside a custom type-scale size", () => {
    // Regression: text-caption was treated as a colour and removed text-brand-foreground
    expect(cn("text-brand-foreground", "text-caption")).toBe("text-brand-foreground text-caption");
    expect(cn("text-small text-danger")).toBe("text-small text-danger");
  });

  it("lets a later type-scale size replace an earlier one", () => {
    expect(cn("text-small", "text-body")).toBe("text-body");
    expect(cn("text-sm", "text-caption")).toBe("text-caption");
  });

  it("still merges colours normally", () => {
    expect(cn("text-foreground", "text-muted-foreground")).toBe("text-muted-foreground");
  });
});
