import { cn } from "@/lib/utils";
import type * as React from "react";

import { Badge } from "@/components/ui/badge";
import type { StatusPreset, StatusTone } from "@/lib/status";

// DESIGN.md §5: soft background + dot + label, e.g. "● Overdue 5 days". Never colour alone.

const dotTone: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground",
  accent: "bg-accent-ink",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

const badgeVariant = {
  neutral: "default",
  accent: "accent",
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
} as const satisfies Record<StatusTone, string>;

type StatusBadgeProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** Either a preset from lib/status.ts … */
  status?: StatusPreset;
  /** … or an explicit tone and label. */
  tone?: StatusTone;
  label?: string;
  /** Extra detail after the label, e.g. "5 days". */
  detail?: string;
};

export function StatusBadge({
  status,
  tone,
  label,
  detail,
  className,
  ...props
}: StatusBadgeProps) {
  const resolvedTone = tone ?? status?.tone ?? "neutral";
  const resolvedLabel = label ?? status?.label ?? "";

  return (
    <Badge variant={badgeVariant[resolvedTone]} className={cn("pl-1.5", className)} {...props}>
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", dotTone[resolvedTone])} />
      <span>
        {resolvedLabel}
        {detail && <span className="num"> {detail}</span>}
      </span>
    </Badge>
  );
}
