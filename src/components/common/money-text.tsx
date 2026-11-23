import { cn } from "@/lib/utils";
import type * as React from "react";

import { formatNaira, isNegativeMoney, type MoneyValue } from "@/lib/format/money";

// DESIGN.md §3b: ₦ attached, tabular figures, negatives in danger colour with a minus sign.
// Pass money as the decimal string from Postgres; right-align it in tables with `text-right`.

type MoneyTextProps = Omit<React.ComponentProps<"span">, "children"> & {
  value: MoneyValue | null | undefined;
  /** "₦1.25B" — for KPI cards. The exact amount is kept in the tooltip title. */
  compact?: boolean;
  /** Set false where a negative must not turn red (e.g. inside a danger badge). */
  colorNegative?: boolean;
};

export function MoneyText({
  value,
  compact = false,
  colorNegative = true,
  className,
  ...props
}: MoneyTextProps) {
  const formatted = value === null || value === undefined ? null : formatNaira(value, { compact });

  if (formatted === null) {
    return (
      <span
        className={cn("num text-muted-foreground", className)}
        aria-label="No amount"
        {...props}
      >
        —
      </span>
    );
  }

  const negative = colorNegative && isNegativeMoney(value as MoneyValue);

  return (
    <span
      className={cn("num whitespace-nowrap", negative && "text-danger", className)}
      title={compact ? (formatNaira(value as MoneyValue) ?? undefined) : undefined}
      {...props}
    >
      {formatted}
    </span>
  );
}
