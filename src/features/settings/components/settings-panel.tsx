import type * as React from "react";

import { cn } from "@/lib/utils";

// Frame for one Settings section: title, one-line description, primary action, content card.
export function SettingsPanel({
  title,
  description,
  action,
  children,
  flush = false,
}: {
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  /** Content runs edge to edge (lists); otherwise padded. */
  flush?: boolean;
}) {
  return (
    <section className="space-y-4" aria-labelledby="settings-panel-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 id="settings-panel-title" className="text-h2">
            {title}
          </h2>
          <p className="max-w-2xl text-body text-muted-foreground">{description}</p>
        </div>
        {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border bg-card shadow-xs",
          !flush && "p-5",
        )}
      >
        {children}
      </div>
    </section>
  );
}
