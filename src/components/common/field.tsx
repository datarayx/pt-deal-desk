import type * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// One form field: label (+ required marker), the control, an optional hint and the error.
// Give the control id={htmlFor} and aria-describedby={`${htmlFor}-hint ${htmlFor}-error`}.
export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-small text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} className="text-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
