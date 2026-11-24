"use client";

import { LinkIcon, PencilIcon, PlusIcon, Trash2Icon, UsersIcon } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DirectorSheet } from "@/features/clients/components/director-sheet";
import { StepFrame } from "@/features/clients/components/step-frame";
import { directorRoleLabel, maskId } from "@/features/clients/options";
import { type DirectorInput, directorsSchema } from "@/features/clients/schemas";
import { personName } from "@/features/clients/wizard-draft";
import { formatRate } from "@/lib/format/rate";
import { cn } from "@/lib/utils";

export function StepDirectors({
  directors,
  onChange,
  onNext,
  onBack,
}: {
  directors: DirectorInput[];
  onChange: (directors: DirectorInput[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  // Shareholdings are small decimals (≤ 100, 3 dp), not money, so Number is fine here.
  const total = directors.reduce((sum, d) => sum + (Number(d.shareholding_pct) || 0), 0);
  const over = total > 100.0001;

  function save(index: number | null, value: DirectorInput) {
    setError(null);
    onChange(
      index === null ? [...directors, value] : directors.map((d, i) => (i === index ? value : d)),
    );
  }

  const addButton = (variant: "default" | "outline") => (
    <DirectorSheet
      onSave={(v) => save(null, v)}
      trigger={
        <Button type="button" variant={variant} size={variant === "outline" ? "sm" : "default"}>
          <PlusIcon /> Add person
        </Button>
      }
    />
  );

  return (
    <StepFrame
      title="Directors and shareholders"
      description="Everyone who runs or owns the company. Each person's KYC documents are collected in the next step."
      error={error}
      onBack={onBack}
      onSubmit={(event) => {
        event.preventDefault();
        const check = directorsSchema.safeParse(directors);
        if (!check.success) {
          setError(check.error.issues[0]?.message ?? "Check the directors.");
          return;
        }
        onNext();
      }}
    >
      {directors.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="No directors yet"
          description="Add at least one director. Shareholders who aren't directors can be added too."
          action={addButton("default")}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-56 flex-1 space-y-1.5">
              <div className="flex items-baseline justify-between text-small">
                <span className="font-medium">Shareholding recorded</span>
                <span className={cn("num", over ? "text-danger" : "text-muted-foreground")}>
                  {formatRate(total) ?? "0%"} of 100%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-subtle" aria-hidden>
                <div
                  className={cn("h-full rounded-full", over ? "bg-danger" : "bg-accent")}
                  style={{ width: `${Math.min(100, total)}%` }}
                />
              </div>
            </div>
            {addButton("outline")}
          </div>

          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {directors.map((d, i) => (
              <li
                key={d.profile.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    {personName(d.profile)}
                    {d.linked_name && (
                      <Badge variant="accent" title="Already on file; will be linked">
                        <LinkIcon /> On file
                      </Badge>
                    )}
                    {d.profile.is_pep && <Badge variant="warning">PEP</Badge>}
                  </p>
                  <p className="num text-small text-muted-foreground">
                    {[
                      d.profile.bvn && `BVN ${maskId(d.profile.bvn)}`,
                      d.profile.nin && `NIN ${maskId(d.profile.nin)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span className="text-small text-muted-foreground">
                  {directorRoleLabel[d.role]}
                </span>
                <span className="w-16 text-right num text-small">
                  {d.shareholding_pct ? formatRate(d.shareholding_pct) : "—"}
                </span>
                <span className="flex items-center gap-0.5">
                  <DirectorSheet
                    director={d}
                    onSave={(v) => save(i, v)}
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${personName(d.profile)}`}
                      >
                        <PencilIcon />
                      </Button>
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${personName(d.profile)}`}
                    onClick={() => onChange(directors.filter((_, j) => j !== i))}
                  >
                    <Trash2Icon />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </StepFrame>
  );
}
