import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// Landing point for links in Supabase emails (password reset, invites).
// Handles both the PKCE `code` flow and the `token_hash` flow, then continues to `next`.
const ALLOWED_NEXT = new Set(["/update-password"]);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "";
  const next = ALLOWED_NEXT.has(nextParam) ? nextParam : "/";

  const supabase = await createSupabaseServerClient();

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  }

  const target = ok ? next : "/login?error=link-expired";
  return NextResponse.redirect(new URL(target, request.url));
}
