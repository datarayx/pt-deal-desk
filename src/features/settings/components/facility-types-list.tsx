"use client";

import { PencilIcon, PlusIcon, TagsIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteFacilityType } from "@/features/settings/actions/facility-type-actions";
import { FacilityTypeSheet } from "@/features/settings/components/facility-type-sheet";
import type { FacilityTypeRow } from "@/features/settings/queries";

export function FacilityTypesList({ facilityTypes }: { facilityTypes: FacilityTypeRow[] }) {
  if (facilityTypes.length === 0) {
    return (
      <EmptyState
        variant="plain"
        icon={<TagsIcon />}
        title="No facility types yet"
        description="Add the kinds of funding P&T arranges so deals can be classified."
        action={
          <FacilityTypeSheet
            trigger={
              <Button>
                <PlusIcon /> Add facility type
              </Button>
            }
          />
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {facilityTypes.map((ft) => (
        <li key={ft.id} className="flex min-h-12 items-center gap-3 px-4 py-2">
          <span className="min-w-0 flex-1 truncate text-body font-medium">{ft.name}</span>
          <span className="w-20 text-right num text-small text-muted-foreground">
            {ft.deal_count} {ft.deal_count === 1 ? "deal" : "deals"}
          </span>
          <span className="flex items-center gap-0.5">
            <FacilityTypeSheet
              facilityType={ft}
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${ft.name}`}>
                  <PencilIcon />
                </Button>
              }
            />
            {ft.deal_count > 0 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex rounded-md">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled
                      aria-label={`${ft.name} is in use`}
                    >
                      <Trash2Icon />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Used by deals, so it can&apos;t be deleted</TooltipContent>
              </Tooltip>
            ) : (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label={`Delete ${ft.name}`}>
                    <Trash2Icon />
                  </Button>
                }
                title={`Delete “${ft.name}”?`}
                description="No deals use this facility type."
                confirmLabel="Delete facility type"
                onConfirm={async () => {
                  const result = await deleteFacilityType(ft.id);
                  if (result.ok) toast.success(`“${ft.name}” deleted`);
                  else toast.error(result.error);
                  return result.ok;
                }}
              />
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
