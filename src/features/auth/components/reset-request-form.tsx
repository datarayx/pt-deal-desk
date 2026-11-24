"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordReset } from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/components/auth-card";
import { FormAlert } from "@/features/auth/components/form-alert";
import { authInputClass, FormField } from "@/features/auth/components/form-field";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { initialAuthFormState } from "@/features/auth/schemas";

export function ResetRequestForm() {
  const [state, action] = useActionState(requestPasswordReset, initialAuthFormState);
  const sent = state.status === "success";

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send you a link to choose a new password."
    >
      <div className="space-y-6">
        {state.message && <FormAlert tone={sent ? "success" : "error"}>{state.message}</FormAlert>}

        {!sent && (
          <form action={action} className="space-y-5" noValidate>
            <FormField id="email" label="Email" error={state.fieldErrors?.email}>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                required
                defaultValue={state.email}
                aria-invalid={state.fieldErrors?.email ? true : undefined}
                aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
                className={authInputClass}
              />
            </FormField>
            <SubmitButton>Send reset link</SubmitButton>
          </form>
        )}

        <Link
          href="/login"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[0.9375rem] font-medium text-auth-teal underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-auth-teal focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <ArrowLeftIcon className="size-4" aria-hidden /> Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
}
