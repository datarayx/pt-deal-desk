import type * as React from "react";

import { cn } from "@/lib/utils";

/** Input styling for the sign-in screens: 52px tall, clear border and focus ring. */
export const authInputClass = cn(
  "block h-13 w-full rounded-[11px] border border-auth-border bg-white px-4 text-base text-auth-heading",
  "transition-[border-color,box-shadow] duration-150 placeholder:text-auth-muted motion-reduce:transition-none",
  "hover:border-[#c4d1de]",
  "focus-visible:border-auth-teal focus-visible:ring-4 focus-visible:ring-auth-teal/15 focus-visible:outline-none",
  "aria-invalid:border-auth-error aria-invalid:focus-visible:ring-auth-error/15",
  "disabled:cursor-not-allowed disabled:bg-auth-canvas disabled:opacity-70",
);

/**
 * Label + control + inline error for sign-in forms. Give the control id={id} and
 * aria-describedby={`${id}-error`}; `aside` sits right of the label (e.g. "Forgot password?").
 */
export function FormField({
  id,
  label,
  error,
  aside,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.9375rem] font-medium text-auth-ink">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm text-auth-error">
          {error}
        </p>
      )}
    </div>
  );
}
