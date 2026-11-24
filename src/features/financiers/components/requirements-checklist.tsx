"use client";

import { ListChecksIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { SortableList } from "@/components/common/sortable-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteRequirement, reorderRequirements } from "@/features/financiers/actions";
import { RequirementSheet } from "@/features/financiers/components/requirement-sheet";
import type { RequirementRow } from "@/features/financiers/queries";

/** The financier's requirement checklist template: sortable, editable in side sheets. */
export function RequirementsChecklist({
  financierId,
  financierName,
  requirements,
}: {
  financierId: string;
  financierName: string;
  requirements: RequirementRow[];
}) {
  const addButton = (variant: "default" | "outline") => (
    <RequirementSheet
      financierId={financierId}
      financierName={financierName}
      trigger={
        <Button variant={variant} size={variant === "outline" ? "sm" : "default"}>
          <PlusIcon /> Add requirement
        </Button>
      }
    />
  );

  const required = requirements.filter((r) => r.is_required).length;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-body font-semibold">Requirement checklist</h2>
          <p className="text-small text-muted-foreground">
            Copied to each new deal with {financierName}. Changes here don&apos;t alter deals
            already in progress.
            {requirements.length > 0 && (
              <>
                {" "}
                <span className="num">{required}</span> required ·{" "}
                <span className="num">{requirements.length - required}</span> optional.
              </>
            )}
          </p>
        </div>
        {requirements.length > 0 && addButton("outline")}
      </div>
      {requirements.length === 0 ? (
        <EmptyState
          variant="plain"
          icon={<ListChecksIcon />}
          title="No checklist yet"
          description="List the documents this financier asks for, so every deal starts with them."
          action={addButton("default")}
        />
      ) : (
        <SortableList
          items={requirements}
          label={`${financierName} requirement checklist`}
          onReorder={async (ids) => {
            const result = await reorderRequirements(financierId, ids);
            if (!result.ok) toast.error(result.error);
            return result.ok;
          }}
          renderItem={(req) => (
            <div className="flex min-h-11 items-center gap-3 py-1.5">
              <span className="min-w-0 flex-1 text-body">{req.item}</span>
              {req.is_required ? (
                <Badge variant="accent">Required</Badge>
              ) : (
                <Badge variant="outline">Optional</Badge>
              )}
              <span className="flex shrink-0 items-center gap-0.5">
                <RequirementSheet
                  financierId={financierId}
                  financierName={financierName}
                  requirement={req}
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${req.item}`}>
                      <PencilIcon />
                    </Button>
                  }
                />
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={`Remove ${req.item}`}>
                      <Trash2Icon />
                    </Button>
                  }
                  title="Remove this requirement?"
                  description={`“${req.item}” won't be added to new deals. Deals that already have it keep it.`}
                  confirmLabel="Remove requirement"
                  onConfirm={async () => {
                    const result = await deleteRequirement(req.id);
                    if (result.ok) toast.success("Requirement removed");
                    else toast.error(result.error);
                    return result.ok;
                  }}
                />
              </span>
            </div>
          )}
        />
      )}
    </div>
  );
}
