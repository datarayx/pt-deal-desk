"use client";

import { useActionState } from "react";

import { Label } from "@/components/ui/label";
import { updatePassword } from "@/features/auth/actions";
import { FormAlert } from "@/features/auth/components/form-alert";
import { PasswordInput } from "@/features/auth/components/password-input";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { initialAuthFormState, PASSWORD_MIN_LENGTH } from "@/features/auth/schemas";

export function UpdatePasswordForm() {
  const [state, action] = useActionState(updatePassword, initialAuthFormState);

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-h1">Choose a new password</h1>
        <p className="text-body text-muted-foreground">
          At least {PASSWORD_MIN_LENGTH} characters. A short phrase is easier to remember.
        </p>
      </div>

      {state.status === "error" && state.message && (
        <FormAlert tone="error">{state.message}</FormAlert>
      )}

      <form action={action} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            autoFocus
            required
            minLength={PASSWORD_MIN_LENGTH}
            aria-invalid={state.fieldErrors?.password ? true : undefined}
            aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
          />
          {state.fieldErrors?.password && (
            <p id="password-error" className="text-small text-danger">
              {state.fieldErrors.password}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm new password</Label>
          <PasswordInput
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            required
            aria-invalid={state.fieldErrors?.confirm ? true : undefined}
            aria-describedby={state.fieldErrors?.confirm ? "confirm-error" : undefined}
          />
          {state.fieldErrors?.confirm && (
            <p id="confirm-error" className="text-small text-danger">
              {state.fieldErrors.confirm}
            </p>
          )}
        </div>
        <SubmitButton>Save new password</SubmitButton>
      </form>
    </div>
  );
}
