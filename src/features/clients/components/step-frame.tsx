"use client";

import { ArrowLeftIcon, ArrowRightIcon, Loader2Icon } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";

/** Card for one wizard step: heading, body and the Back / Continue footer. */
export function StepFrame({
  title,
  description,
  onSubmit,
  onBack,
  submitLabel = "Continue",
  pending = false,
  error,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onBack?: () => void;
  submitLabel?: string;
  pending?: boolean;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
    >
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-h2">{title}</h2>
        {description && (
          <p className="mt-1 max-w-2xl text-body text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-8 px-5 py-6 sm:px-6">{children}</div>
      {error && (
        <p
          role="alert"
          className="mx-5 mb-4 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-small text-danger-soft-foreground sm:mx-6"
        >
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-subtle/50 px-5 py-3 sm:px-6">
        {onBack ? (
          <Button type="button" variant="ghost" onClick={onBack} disabled={pending}>
            <ArrowLeftIcon /> Back
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" />}
          {submitLabel}
          {!pending && submitLabel === "Continue" && <ArrowRightIcon />}
        </Button>
      </div>
    </form>
  );
}
