"use client";

import type * as React from "react";
import { useFormStatus } from "react-dom";

import { AuthButton } from "@/features/auth/components/auth-button";

// Full-width primary submit for a form action, with an instant pending state.
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <AuthButton type="submit" pending={pending}>
      {children}
    </AuthButton>
  );
}
