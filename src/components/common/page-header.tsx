import { cn } from "@/lib/utils";
import { MoreHorizontalIcon } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// DESIGN.md §4: title, short description, primary action on the right, secondary actions in "…".
// Keep it to ONE primary button per view (DESIGN.md §8).

type PageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  /** Small line above the title, e.g. a breadcrumb or "Finance". */
  eyebrow?: React.ReactNode;
  /** Badges/facts shown next to the title (e.g. a StatusBadge on a detail page). */
  meta?: React.ReactNode;
  /** The primary action — usually a single default <Button>. Outline buttons may sit before it. */
  actions?: React.ReactNode;
  /** <DropdownMenuItem>s for secondary actions, rendered in the "…" menu. */
  menu?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  meta,
  actions,
  menu,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow && <div className="text-caption font-medium text-muted-foreground">{eyebrow}</div>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="truncate text-h1 text-foreground">{title}</h1>
          {meta}
        </div>
        {description && <p className="max-w-2xl text-body text-muted-foreground">{description}</p>}
      </div>

      {(actions || menu) && (
        <div className="flex shrink-0 items-center gap-2">
          {menu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions">
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">{menu}</DropdownMenuContent>
            </DropdownMenu>
          )}
          {actions}
        </div>
      )}
    </header>
  );
}
