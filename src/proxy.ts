import { type NextRequest, NextResponse } from "next/server";

import { canAccess, homeFor, isPublicPath, isSignInPath } from "@/lib/auth/access";
import { getSupabasePublicEnv, SUPABASE_SETUP_MESSAGE } from "@/lib/supabase/env";
import { getProxySession, redirectWithSession } from "@/lib/supabase/proxy-session";

// Route protection (tasks 0.4/0.5). Runs before every page:
//  - refreshes the Supabase session cookie
//  - signed out            → /login?next=<path>   (public pages excepted)
//  - signed in, no access  → /login?error=no-access (inactive or role not assigned)
//  - signed in on /login   → the role's home
//  - accountant outside /finance → /finance
// This is the UI gate only. Data is protected by Row-Level Security in Postgres.

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const env = getSupabasePublicEnv();
  if (!env) {
    // Fail closed: never serve the app unprotected because keys are missing.
    if (pathname.startsWith("/styleguide")) return NextResponse.next();
    return new NextResponse(SUPABASE_SETUP_MESSAGE, {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const { response, userId, role } = await getProxySession(request, env);
  const to = (path: string) => redirectWithSession(response, new URL(path, request.url));

  if (!userId) {
    if (isPublicPath(pathname)) return response;
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
    return redirectWithSession(response, login);
  }

  if (!role) {
    // Signed in but not allowed in (no admin-assigned role, or deactivated).
    if (isPublicPath(pathname)) return response;
    return to("/login?error=no-access");
  }

  if (pathname === "/" || isSignInPath(pathname)) return to(homeFor(role));
  if (!canAccess(role, pathname)) return to(homeFor(role));

  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals and static files
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
