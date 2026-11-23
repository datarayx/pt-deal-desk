"use client";

import { BellIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { deleteRecipient, setRecipientActive } from "@/features/settings/actions/recipient-actions";
import { RecipientSheet } from "@/features/settings/components/recipient-sheet";
import type { RecipientRow } from "@/features/settings/queries";
import { alertTypeLabel } from "@/features/settings/schemas";

export function RecipientsList({ recipients }: { recipients: RecipientRow[] }) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    recipients,
    (rows, change: { id: string; active: boolean }) =>
      rows.map((r) => (r.id === change.id ? { ...r, is_active: change.active } : r)),
  );

  if (recipients.length === 0) {
    return (
      <EmptyState
        variant="plain"
        icon={<BellIcon />}
        title="No one gets alerts yet"
        description="Add the people who should hear about due and overdue repayments and stale deals."
        action={
          <RecipientSheet
            trigger={
              <Button>
                <PlusIcon /> Add recipient
              </Button>
            }
          />
        }
      />
    );
  }

  function toggle(recipient: RecipientRow, active: boolean) {
    startTransition(async () => {
      setOptimistic({ id: recipient.id, active });
      const result = await setRecipientActive(recipient.id, active);
      if (result.ok)
        toast.success(
          active ? `${recipient.name} will get alerts` : `Alerts paused for ${recipient.name}`,
        );
      else toast.error(result.error);
    });
  }

  return (
    <ul className="divide-y divide-border">
      {optimistic.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-medium">
              {r.name}
              {r.title && <span className="font-normal text-muted-foreground"> · {r.title}</span>}
            </p>
            <p className="truncate text-small text-muted-foreground">{r.email}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:max-w-80 sm:justify-end">
            {r.alert_types.map((t) => (
              <Badge key={t} variant={r.is_active ? "default" : "outline"}>
                {alertTypeLabel[t]}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Switch
              checked={r.is_active}
              onCheckedChange={(next) => toggle(r, next)}
              aria-label={
                r.is_active ? `Pause alerts for ${r.name}` : `Resume alerts for ${r.name}`
              }
              className="mr-2"
            />
            <RecipientSheet
              recipient={r}
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${r.name}`}>
                  <PencilIcon />
                </Button>
              }
            />
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${r.name}`}>
                  <Trash2Icon />
                </Button>
              }
              title={`Remove ${r.name}?`}
              description="They'll stop getting alert emails. Emails already in the Outbox are kept."
              confirmLabel="Remove recipient"
              onConfirm={async () => {
                const result = await deleteRecipient(r.id);
                if (result.ok) toast.success(`${r.name} removed`);
                else toast.error(result.error);
                return result.ok;
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
