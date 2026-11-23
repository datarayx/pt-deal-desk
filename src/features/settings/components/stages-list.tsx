"use client";

import { LockIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { SortableList } from "@/components/common/sortable-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteStage, reorderStages } from "@/features/settings/actions/stage-actions";
import { StageSheet } from "@/features/settings/components/stage-sheet";
import type { StageRow } from "@/features/settings/queries";

export function StagesList({ stages }: { stages: StageRow[] }) {
  async function onReorder(ids: string[]) {
    const result = await reorderStages(ids);
    if (!result.ok) toast.error(result.error);
    return result.ok;
  }

  return (
    <SortableList
      items={stages}
      label="deal stages"
      onReorder={onReorder}
      renderItem={(stage) => (
        <div className="flex min-h-12 items-center gap-3 py-2">
          <span className="w-5 text-right num text-caption text-muted-foreground">
            {stage.sort_order}
          </span>
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: stage.color ?? "var(--muted-foreground)" }}
          />
          <span className="min-w-0 flex-1 truncate text-body font-medium">{stage.name}</span>
          <span className="hidden items-center gap-1.5 sm:flex">
            {stage.system_key && (
              <Badge variant="outline">
                <LockIcon /> Workflow
              </Badge>
            )}
            {stage.is_terminal && <Badge variant="default">Final</Badge>}
          </span>
          <span className="w-20 text-right num text-small text-muted-foreground">
            {stage.deal_count} {stage.deal_count === 1 ? "deal" : "deals"}
          </span>
          <span className="flex items-center gap-0.5">
            <StageSheet
              stage={stage}
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${stage.name}`}>
                  <PencilIcon />
                </Button>
              }
            />
            {stage.system_key || stage.deal_count > 0 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex rounded-md">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled
                      aria-label={`${stage.name} can't be deleted`}
                    >
                      <Trash2Icon />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {stage.system_key
                    ? "Workflow stages can be renamed but not deleted"
                    : "Move its deals to another stage first"}
                </TooltipContent>
              </Tooltip>
            ) : (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label={`Delete ${stage.name}`}>
                    <Trash2Icon />
                  </Button>
                }
                title={`Delete the “${stage.name}” stage?`}
                description="It will disappear from the pipeline. No deals are in this stage."
                confirmLabel="Delete stage"
                onConfirm={async () => {
                  const result = await deleteStage(stage.id);
                  if (result.ok) toast.success(`“${stage.name}” deleted`);
                  else toast.error(result.error);
                  return result.ok;
                }}
              />
            )}
          </span>
        </div>
      )}
    />
  );
}
