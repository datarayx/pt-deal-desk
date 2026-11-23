"use client";

import { CircleAlertIcon } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// The create/edit pattern (DESIGN.md §5): side sheet, fixed header and footer, scrolling body,
// one primary button with an instant pending state, form-level error shown above the fields.
export function FormSheet({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  submitLabel,
  pending,
  formError,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  submitLabel: string;
  pending: boolean;
  formError?: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <SheetBody className="space-y-5">
            {formError && (
              <div
                role="alert"
                className="flex gap-2.5 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2.5 text-small text-danger-soft-foreground"
              >
                <CircleAlertIcon className="mt-px size-4 shrink-0" aria-hidden />
                <p>{formError}</p>
              </div>
            )}
            {children}
          </SheetBody>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            </SheetClose>
            <Button type="submit" pending={pending}>
              {submitLabel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
