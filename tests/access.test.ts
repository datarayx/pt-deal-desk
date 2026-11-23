import { describe, expect, it } from "vitest";

import { canAccess, homeFor, isPublicPath, ROLES, safeNextPath } from "@/lib/auth/access";
import { allNavItems } from "@/lib/navigation";

describe("canAccess", () => {
  it("lets the CEO open everything", () => {
    for (const path of ["/dashboard", "/clients/abc", "/settings/users", "/finance/reports"]) {
      expect(canAccess("ceo", path)).toBe(true);
    }
  });

  it("keeps the accountant inside /finance", () => {
    expect(canAccess("accountant", "/finance")).toBe(true);
    expect(canAccess("accountant", "/finance/reports")).toBe(true);
    for (const path of [
      "/dashboard",
      "/clients",
      "/clients/abc",
      "/deals/1",
      "/repayments",
      "/settings/users",
      "/outbox",
      "/financiers",
    ]) {
      expect(canAccess("accountant", path)).toBe(false);
    }
  });

  it("does not treat look-alike prefixes as finance", () => {
    expect(canAccess("accountant", "/financiers")).toBe(false);
    expect(canAccess("accountant", "/finance-x")).toBe(false);
  });

  it("allows public and any-role pages for every role", () => {
    for (const role of ROLES) {
      expect(canAccess(role, "/login")).toBe(true);
      expect(canAccess(role, "/update-password")).toBe(true);
    }
    expect(isPublicPath("/auth/callback")).toBe(true);
    expect(isPublicPath("/dashboard")).toBe(false);
  });
});

describe("navigation roles match access rules", () => {
  it("shows every nav item only to roles that can open it", () => {
    for (const item of allNavItems) {
      for (const role of ROLES) {
        expect({ href: item.href, role, visible: item.roles.includes(role) }).toEqual({
          href: item.href,
          role,
          visible: canAccess(role, item.href),
        });
      }
    }
  });
});

describe("homeFor / safeNextPath", () => {
  it("sends each role home", () => {
    expect(homeFor("ceo")).toBe("/dashboard");
    expect(homeFor("accountant")).toBe("/finance");
  });

  it("keeps allowed internal paths, including query strings", () => {
    expect(safeNextPath("/deals/42?tab=fees", "ceo")).toBe("/deals/42?tab=fees");
    expect(safeNextPath("/finance/reports", "accountant")).toBe("/finance/reports");
  });

  it("rejects off-site, sign-in and forbidden destinations", () => {
    expect(safeNextPath("https://evil.example", "ceo")).toBe("/dashboard");
    expect(safeNextPath("//evil.example", "ceo")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.example", "ceo")).toBe("/dashboard");
    expect(safeNextPath("/login", "ceo")).toBe("/dashboard");
    expect(safeNextPath("/clients", "accountant")).toBe("/finance");
    expect(safeNextPath(null, "accountant")).toBe("/finance");
  });
});
