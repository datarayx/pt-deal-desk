// Who may open which page (docs/PRD.md §3, docs/SECURITY.md). Pure module: used by the proxy,
// the login action and tests. This is the UI gate; the database enforces the same rules with RLS.

export type Role = "ceo" | "accountant";

export const ROLES: readonly Role[] = ["ceo", "accountant"];

/** Pages anyone can open, signed in or not. */
const PUBLIC_PREFIXES = ["/login", "/reset-password", "/auth", "/styleguide"] as const;

/** Pages for any signed-in user, whatever their role. */
const ANY_ROLE_PREFIXES = ["/update-password"] as const;

/** The accountant sees the books only — no clients, KYC, deals or repayments. */
const ACCOUNTANT_PREFIXES = ["/finance", "/imports"] as const;

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => matches(pathname, p));
}

/** Sign-in pages a signed-in user should be bounced away from. */
export function isSignInPath(pathname: string): boolean {
  return matches(pathname, "/login") || matches(pathname, "/reset-password");
}

export function canAccess(role: Role, pathname: string): boolean {
  if (isPublicPath(pathname) || ANY_ROLE_PREFIXES.some((p) => matches(pathname, p))) return true;
  if (role === "ceo") return true;
  return ACCOUNTANT_PREFIXES.some((p) => matches(pathname, p));
}

/** Where each role lands after signing in. */
export function homeFor(role: Role): string {
  return role === "ceo" ? "/dashboard" : "/finance";
}

/**
 * A safe post-login destination: an internal path the role may open, else the role's home.
 * Rejects absolute and protocol-relative URLs ("//evil.com") so `next` can't redirect off-site.
 */
export function safeNextPath(next: string | null | undefined, role: Role): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return homeFor(role);
  }
  const pathname = next.split(/[?#]/)[0] ?? "";
  if (isSignInPath(pathname) || !canAccess(role, pathname)) return homeFor(role);
  return next;
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

