"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type * as React from "react";

import { signIn, signOut } from "@/features/auth/actions";
import { AuthButton } from "@/features/auth/components/auth-button";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthPasswordInput } from "@/features/auth/components/auth-password-input";
import { type DemoAccount, DemoAccessCard } from "@/features/auth/components/demo-access-card";
import { FormAlert } from "@/features/auth/components/form-alert";
import { authInputClass, FormField } from "@/features/auth/components/form-field";
import { initialAuthFormState, signInSchema } from "@/features/auth/schemas";

type Field = "email" | "password";

const linkErrors: Record<string, string> = {
  "link-expired": "That link has expired or was already used. Request a new one.",
};

/** Same rules as the server (signInSchema), checked before sending so mistakes show instantly. */
function validate(email: string, password: string): Partial<Record<Field, string>> {
  const parsed = signInSchema.pick({ email: true, password: true }).safeParse({ email, password });
  if (parsed.success) return {};
  const errors: Partial<Record<Field, string>> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if ((key === "email" || key === "password") && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

// Reads ?next and ?error, so it must render inside <Suspense> (Next 16 cacheComponents).
export function LoginCard({ demoAccounts }: { demoAccounts: readonly DemoAccount[] }) {
  const params = useSearchParams();
  const [state, action, isPending] = useActionState(signIn, initialAuthFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  // Controlled, so what was typed survives both inline validation and a failed sign-in.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<Partial<Record<Field, string>>>({});
  const [edited, setEdited] = useState<Partial<Record<Field, boolean>>>({});
  const [demoEmail, setDemoEmail] = useState<string | null>(null);
  const fromDemo = useRef(false);

  const urlError = params.get("error");
  const errorFor = (field: Field) =>
    clientErrors[field] ?? (edited[field] ? undefined : state.fieldErrors?.[field]);

  function change(field: Field, value: string) {
    if (field === "email") setEmail(value);
    else setPassword(value);
    setEdited((e) => ({ ...e, [field]: true }));
    if (clientErrors[field]) setClientErrors((e) => ({ ...e, [field]: undefined }));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!fromDemo.current) setDemoEmail(null);
    fromDemo.current = false;
    const errors = validate(email, password);
    if (errors.email || errors.password) {
      event.preventDefault();
      setClientErrors(errors);
      (errors.email ? emailRef : passwordRef).current?.focus();
      return;
    }
    setClientErrors({});
    setEdited({});
  }

  function signInAsDemo(account: DemoAccount) {
    flushSync(() => {
      setEmail(account.email);
      setPassword(account.password);
      setClientErrors({});
      setDemoEmail(account.email);
    });
    fromDemo.current = true;
    formRef.current?.requestSubmit();
  }

  return (
    <AuthCard title="Welcome back" description="Sign in with your P&T staff account.">
      <div className="space-y-5">
        {urlError === "no-access" && (
          <FormAlert tone="error">
            <p>Your account doesn&apos;t have access yet. Ask the CEO to activate it.</p>
            <form action={signOut} className="mt-1.5">
              <button type="submit" className="font-medium underline underline-offset-2">
                Sign out and use another account
              </button>
            </form>
          </FormAlert>
        )}
        {urlError && linkErrors[urlError] && (
          <FormAlert tone="error">{linkErrors[urlError]}</FormAlert>
        )}
        {state.status === "error" && state.message && !isPending && (
          <FormAlert tone="error">{state.message}</FormAlert>
        )}

        <form ref={formRef} action={action} onSubmit={onSubmit} noValidate className="space-y-4">
          <input type="hidden" name="next" value={params.get("next") ?? ""} />

          <FormField id="email" label="Email" error={errorFor("email")}>
            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              required
              value={email}
              onChange={(e) => change("email", e.target.value)}
              aria-invalid={errorFor("email") ? true : undefined}
              aria-describedby={errorFor("email") ? "email-error" : undefined}
              className={authInputClass}
            />
          </FormField>

          <FormField
            id="password"
            label="Password"
            error={errorFor("password")}
            aside={
              <Link
                href="/reset-password"
                className="-my-3 inline-flex min-h-11 items-center rounded-sm text-[0.9375rem] font-medium text-auth-teal underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-auth-teal focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Forgot password?
              </Link>
            }
          >
            <AuthPasswordInput
              ref={passwordRef}
              id="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => change("password", e.target.value)}
              aria-invalid={errorFor("password") ? true : undefined}
              aria-describedby={errorFor("password") ? "password-error" : undefined}
            />
          </FormField>

          <AuthButton
            type="submit"
            pending={isPending && !demoEmail}
            pendingLabel="Signing in…"
            disabled={isPending}
            className="mt-1"
          >
            Sign in
          </AuthButton>
        </form>

        <DemoAccessCard
          accounts={demoAccounts}
          pendingEmail={isPending ? demoEmail : null}
          disabled={isPending}
          onSignIn={signInAsDemo}
        />
      </div>
    </AuthCard>
  );
}
