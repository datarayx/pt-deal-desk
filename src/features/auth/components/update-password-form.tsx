"use client";

import { useActionState } from "react";

import { updatePassword } from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthPasswordInput } from "@/features/auth/components/auth-password-input";
import { FormAlert } from "@/features/auth/components/form-alert";
import { FormField } from "@/features/auth/components/form-field";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { initialAuthFormState, PASSWORD_MIN_LENGTH } from "@/features/auth/schemas";

export function UpdatePasswordForm() {
  const [state, action] = useActionState(updatePassword, initialAuthFormState);

  return (
    <AuthCard
      title="Choose a new password"
      description={`At least ${PASSWORD_MIN_LENGTH} characters. A short phrase is easier to remember.`}
    >
      <div className="space-y-6">
        {state.status === "error" && state.message && (
          <FormAlert tone="error">{state.message}</FormAlert>
        )}
        <form action={action} className="space-y-5" noValidate>
          <FormField id="password" label="New password" error={state.fieldErrors?.password}>
            <AuthPasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              autoFocus
              required
              minLength={PASSWORD_MIN_LENGTH}
              aria-invalid={state.fieldErrors?.password ? true : undefined}
              aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
            />
          </FormField>
          <FormField id="confirm" label="Confirm new password" error={state.fieldErrors?.confirm}>
            <AuthPasswordInput
              id="confirm"
              name="confirm"
              autoComplete="new-password"
              required
              aria-invalid={state.fieldErrors?.confirm ? true : undefined}
              aria-describedby={state.fieldErrors?.confirm ? "confirm-error" : undefined}
            />
          </FormField>
          <SubmitButton>Save new password</SubmitButton>
        </form>
      </div>
    </AuthCard>
  );
}
