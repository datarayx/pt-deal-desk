"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteReferrer } from "@/features/referrers/actions";
import { ReferrerSheet } from "@/features/referrers/components/referrer-sheet";
import type { ReferrerDetail } from "@/features/referrers/queries";

/** Header actions on the referrer page: Edit (primary) and Delete (only with no history). */
export function ReferrerActions({ referrer }: { referrer: ReferrerDetail }) {
  const router = useRouter();
  const inUse = referrer.deal_count > 0 || referrer.clients_referred > 0;
  return (
    <>
      {inUse ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-flex rounded-md">
              <Button variant="outline" size="icon" disabled aria-label="Delete referrer">
                <Trash2Icon />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Has clients or deals, so it can&apos;t be deleted</TooltipContent>
        </Tooltip>
      ) : (
        <ConfirmDialog
          trigger={
            <Button variant="outline" size="icon" aria-label="Delete referrer">
              <Trash2Icon />
            </Button>
          }
          title={`Delete ${referrer.name}?`}
          description="They have no clients or deals. This can't be undone."
          confirmLabel="Delete referrer"
          onConfirm={async () => {
            const result = await deleteReferrer(referrer.id);
            if (result.ok) {
              toast.success(`${referrer.name} deleted`);
              router.replace("/referrers");
            } else toast.error(result.error);
            return result.ok;
          }}
        />
      )}
      <ReferrerSheet
        referrer={referrer}
        trigger={
          <Button>
            <PencilIcon /> Edit referrer
          </Button>
        }
      />
    </>
  );
}
