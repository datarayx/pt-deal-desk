import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthFormSkeleton } from "@/features/auth/components/auth-form-skeleton";
import { type DemoAccount, LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

/** Demo credentials are shown only in demo mode (DECISIONS.md) — never in production. */
function demoAccounts(): DemoAccount[] {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return [];
  const accounts: DemoAccount[] = [];
  const { DEMO_CEO_EMAIL, DEMO_CEO_PASSWORD, DEMO_ACCOUNTANT_EMAIL, DEMO_ACCOUNTANT_PASSWORD } =
    process.env;
  if (DEMO_CEO_EMAIL && DEMO_CEO_PASSWORD) {
    accounts.push({ label: "CEO", email: DEMO_CEO_EMAIL, password: DEMO_CEO_PASSWORD });
  }
  if (DEMO_ACCOUNTANT_EMAIL && DEMO_ACCOUNTANT_PASSWORD) {
    accounts.push({
      label: "Accountant",
      email: DEMO_ACCOUNTANT_EMAIL,
      password: DEMO_ACCOUNTANT_PASSWORD,
    });
  }
  return accounts;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <LoginForm demoAccounts={demoAccounts()} />
    </Suspense>
  );
}
