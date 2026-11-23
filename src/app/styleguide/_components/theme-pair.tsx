import { cn } from "@/lib/utils";
import type * as React from "react";

export type ThemeMode = "light" | "dark";

// Renders the same content twice: once with light tokens, once with dark tokens, side by side.
// Works regardless of the page theme because each pane re-declares the tokens on its own root.
// `children` is a function so each pane can give its form fields unique ids.
export function ThemePair({
  children,
  className,
  stacked = false,
}: {
  children: (mode: ThemeMode) => React.ReactNode;
  className?: string;
  /** Light above dark instead of side by side — for wide content such as tables. */
  stacked?: boolean;
}) {
  return (
    <div className={cn("grid gap-4", !stacked && "xl:grid-cols-2", className)}>
      {(["light", "dark"] as const).map((mode) => (
        <div
          key={mode}
          className={cn(
            mode,
            "relative min-w-0 rounded-xl border border-border bg-background p-5 pt-9 text-foreground",
          )}
        >
          <span className="absolute top-3 left-5 text-caption font-medium text-muted-foreground capitalize">
            {mode}
          </span>
          {children(mode)}
        </div>
      ))}
    </div>
  );
}
