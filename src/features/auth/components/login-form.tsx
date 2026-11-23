"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signOut } from "@/features/auth/actions";
import { FormAlert } from "@/features/auth/components/form-alert";
import { PasswordInput } from "@/features/auth/components/password-input";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { initialAuthFormState } from "@/features/auth/schemas";

export type DemoAccount = { label: string; email: string; password: string };

const linkErrors: Record<string, string> = {
  "link-expired": "That link has expired or was already used. Request a new one.",
};

// Reads ?next and ?error, so it must render inside <Suspense> (Next 16 cacheComponents).
export function LoginForm({ demoAccounts }: { demoAccounts: readonly DemoAccount[] }) {
  const params = useSearchParams();
  const [state, action] = useActionState(signIn, initialAuthFormState);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const urlError = params.get("error");
  const noAccess = urlError === "no-access";

  function signInAsDemo(account: DemoAccount) {
    if (emailRef.current) emailRef.current.value = account.email;
    if (passwordRef.current) passwordRef.current.value = account.password;
    passwordRef.current?.form?.requestSubmit();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-h1">Sign in</h1>
        <p className="text-body text-muted-foreground">
          Use the email and password the CEO set up for you.
        </p>
      </div>

      {noAccess && (
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
      {state.status === "error" && state.message && (
        <FormAlert tone="error">{state.message}</FormAlert>
      )}

      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={params.get("next") ?? ""} />

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            autoFocus
            required
            defaultValue={state.email}
            aria-invalid={state.fieldErrors?.email ? true : undefined}
            aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
            className="h-10"
          />
          {state.fieldErrors?.email && (
            <p id="email-error" className="text-small text-danger">
              {state.fieldErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/reset-password"
              className="text-small font-medium text-accent-ink hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            ref={passwordRef}
            id="password"
            name="password"
            autoComplete="current-password"
            required
            aria-invalid={state.fieldErrors?.password ? true : undefined}
            aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
          />
          {state.fieldErrors?.password && (
            <p id="password-error" className="text-small text-danger">
              {state.fieldErrors.password}
            </p>
          )}
        </div>

        <SubmitButton>Sign in</SubmitButton>
      </form>

      {demoAccounts.length > 0 && (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-subtle/50 p-4">
          <p className="text-caption font-medium text-muted-foreground">
            Demo mode · fictional data only
          </p>
          <ul className="mt-3 space-y-2">
            {demoAccounts.map((account) => (
              <li key={account.email} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-small font-medium">{account.label}</p>
                  <p className="truncate text-caption text-muted-foreground">
                    {account.email} · <span className="font-mono">{account.password}</span>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => signInAsDemo(account)}
                >
                  Sign in
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
