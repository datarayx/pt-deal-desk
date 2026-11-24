"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteFinancier } from "@/features/financiers/actions";
import { FinancierSheet } from "@/features/financiers/components/financier-sheet";
import type { FinancierDetail } from "@/features/financiers/queries";

/** Header actions on the financier page: Edit (primary) and Delete (only without deals). */
export function FinancierActions({
  financier,
  facilityTypeNames,
}: {
  financier: FinancierDetail;
  facilityTypeNames: string[];
}) {
  const router = useRouter();
  return (
    <>
      {financier.deal_count > 0 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-flex rounded-md">
              <Button variant="outline" size="icon" disabled aria-label="Delete financier">
                <Trash2Icon />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Has deals, so it can&apos;t be deleted</TooltipContent>
        </Tooltip>
      ) : (
        <ConfirmDialog
          trigger={
            <Button variant="outline" size="icon" aria-label="Delete financier">
              <Trash2Icon />
            </Button>
          }
          title={`Delete ${financier.name}?`}
          description="Their details and requirement checklist will be removed. This can't be undone."
          confirmLabel="Delete financier"
          onConfirm={async () => {
            const result = await deleteFinancier(financier.id);
            if (result.ok) {
              toast.success(`${financier.name} deleted`);
              router.replace("/financiers");
            } else toast.error(result.error);
            return result.ok;
          }}
        />
      )}
      <FinancierSheet
        financier={financier}
        facilityTypeNames={facilityTypeNames}
        trigger={
          <Button>
            <PencilIcon /> Edit financier
          </Button>
        }
      />
    </>
  );
}
