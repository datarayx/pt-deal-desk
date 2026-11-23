import { cn } from "@/lib/utils";
import type * as React from "react";

import { type DateValue, formatDate, toDateTimeAttribute } from "@/lib/format/date";

// AGENTS.md: "23 Nov 2026", Africa/Lagos. Calendar dates ("2026-11-23") are never shifted.

type DateTextProps = Omit<React.ComponentProps<"time">, "children" | "dateTime"> & {
  value: DateValue | null | undefined;
  withTime?: boolean;
};

export function DateText({ value, withTime = false, className, ...props }: DateTextProps) {
  const formatted = value === null || value === undefined ? null : formatDate(value, { withTime });

  if (formatted === null || value === null || value === undefined) {
    return (
      <span className={cn("num text-muted-foreground", className)} aria-label="No date">
        —
      </span>
    );
  }

  return (
    <time
      dateTime={toDateTimeAttribute(value) ?? undefined}
      className={cn("num whitespace-nowrap", className)}
      {...props}
    >
      {formatted}
    </time>
  );
}
