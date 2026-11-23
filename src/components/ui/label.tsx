"use client";

import { cn } from "@/lib/utils";
import { Label as LabelPrimitive } from "radix-ui";
import * as React from "react";

function Label({
  className,
  required,
  children,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & {
  /** Adds the required marker (DESIGN.md §7: clear required markers). */
  required?: boolean;
}) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-1 text-small font-medium text-foreground select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-danger" aria-hidden>
          *
        </span>
      )}
    </LabelPrimitive.Root>
  );
}

export { Label };
