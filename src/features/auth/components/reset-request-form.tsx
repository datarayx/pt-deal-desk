"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/features/auth/actions";
import { FormAlert } from "@/features/auth/components/form-alert";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { initialAuthFormState } from "@/features/auth/schemas";

export function ResetRequestForm() {
  const [state, action] = useActionState(requestPasswordReset, initialAuthFormState);
  const sent = state.status === "success";

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-h1">Reset your password</h1>
        <p className="text-body text-muted-foreground">
          Enter your email and we&apos;ll send you a link to choose a new password.
        </p>
      </div>

      {state.message && <FormAlert tone={sent ? "success" : "error"}>{state.message}</FormAlert>}

      {!sent && (
        <form action={action} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
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
          <SubmitButton>Send reset link</SubmitButton>
        </form>
      )}

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-small font-medium text-accent-ink hover:underline"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden /> Back to sign in
      </Link>
    </div>
  );
}
