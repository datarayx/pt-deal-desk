import { cn } from "@/lib/utils";
import type * as React from "react";

// DESIGN.md §5: one line of guidance + primary action. No illustrations, no emoji.

type EmptyStateProps = {
  /** A lucide icon element, e.g. <UsersIcon />. */
  icon?: React.ReactNode;
  title: string;
  /** One line telling the user what to do next. */
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** "card" draws its own dashed panel; "plain" sits inside an existing card or table. */
  variant?: "card" | "plain";
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "card",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        variant === "card" && "rounded-xl border border-dashed border-border-strong bg-surface",
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden
          className="mb-4 flex size-10 items-center justify-center rounded-lg border border-border bg-surface-subtle text-muted-foreground [&_svg]:size-5"
        >
          {icon}
        </div>
      )}
      <h3 className="text-body font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-body text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5 flex items-center gap-2">{action}</div>}
    </div>
  );
}
