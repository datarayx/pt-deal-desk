"use client";

import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Multi-select as a row of toggle buttons (aria-pressed). Keeps the caller's option order. */
export function ToggleChips<T extends string | number>({
  options,
  value,
  onChange,
  label,
  describedBy,
  id,
}: {
  options: readonly { value: T; label: string }[];
  value: readonly T[];
  onChange: (next: T[]) => void;
  label: string;
  describedBy?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => {
        const pressed = value.includes(option.value);
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={pressed}
            onClick={() =>
              onChange(
                pressed
                  ? value.filter((v) => v !== option.value)
                  : options
                      .map((o) => o.value)
                      .filter((v) => v === option.value || value.includes(v)),
              )
            }
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-small font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none",
              pressed
                ? "border-accent bg-accent-soft text-accent-ink"
                : "border-border bg-surface text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
            )}
          >
            {pressed && <CheckIcon className="size-3.5" aria-hidden />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
