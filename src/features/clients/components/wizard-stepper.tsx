"use client";

import { CheckIcon } from "lucide-react";

import type { StepKey } from "@/features/clients/wizard-draft";
import { cn } from "@/lib/utils";

/** Progress for the New Client steps. Completed steps can be revisited. */
export function WizardStepper({
  steps,
  current,
  furthest,
  onGo,
}: {
  steps: { key: StepKey; label: string }[];
  current: number;
  /** Highest step index reached so far. */
  furthest: number;
  onGo: (index: number) => void;
}) {
  return (
    <nav aria-label="New client progress">
      <ol className="flex items-center gap-2 overflow-x-auto pb-1">
        {steps.map((step, i) => {
          const done = i < current || (i <= furthest && i !== current);
          const active = i === current;
          const reachable = i <= furthest && !active;
          return (
            <li key={step.key} className="flex shrink-0 items-center gap-2">
              {i > 0 && (
                <span
                  className={cn("h-px w-6 sm:w-10", i <= furthest ? "bg-accent" : "bg-border")}
                  aria-hidden
                />
              )}
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onGo(i)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-small font-medium transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  active && "bg-accent-soft text-accent-ink",
                  !active && reachable && "text-foreground hover:bg-surface-subtle",
                  !active && !reachable && "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border num text-caption",
                    active && "border-accent bg-accent text-accent-foreground",
                    !active && done && "border-accent text-accent-ink",
                    !active && !done && "border-border-strong",
                  )}
                  aria-hidden
                >
                  {!active && done ? <CheckIcon className="size-3.5" /> : i + 1}
                </span>
                {step.label}
                <span className="sr-only">
                  {active ? " (current step)" : done ? " (done)" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
