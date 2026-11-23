"use client";

import { LogOutIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DateText } from "@/components/common/date-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { signOutUserEverywhere } from "@/features/settings/actions/user-actions";
import { EditUserSheet } from "@/features/settings/components/edit-user-sheet";
import type { UserRow } from "@/features/settings/queries";
import { roleInfo } from "@/features/settings/settings-values";

function statusBadge(user: UserRow) {
  if (!user.is_active) return <Badge variant="outline">Deactivated</Badge>;
  if (user.invited_pending) return <Badge variant="warning">Invited</Badge>;
  return <Badge variant="success">Active</Badge>;
}

export function UsersList({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  return (
    <ul className="divide-y divide-border">
      {users.map((u) => {
        const isSelf = u.id === currentUserId;
        return (
          <li
            key={u.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-soft text-small font-semibold text-neutral-soft-foreground">
              {u.full_name
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-medium">
                {u.full_name}
                {isSelf && <span className="font-normal text-muted-foreground"> (you)</span>}
              </p>
              <p className="truncate text-small text-muted-foreground">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={u.role === "ceo" ? "accent" : "default"}>
                {roleInfo[u.role].label}
              </Badge>
              {statusBadge(u)}
            </div>
            <div className="w-36 text-small text-muted-foreground sm:text-right">
              {u.last_sign_in_at ? (
                <>
                  Last in <DateText value={u.last_sign_in_at} />
                </>
              ) : (
                "Never signed in"
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <EditUserSheet
                user={u}
                isSelf={isSelf}
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label={`Edit ${u.full_name}`}>
                    <PencilIcon />
                  </Button>
                }
              />
              {isSelf ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-flex rounded-md">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled
                        aria-label="Sign yourself out everywhere"
                      >
                        <LogOutIcon />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Use Sign out in the account menu for yourself</TooltipContent>
                </Tooltip>
              ) : (
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Sign ${u.full_name} out everywhere`}
                    >
                      <LogOutIcon />
                    </Button>
                  }
                  title={`Sign ${u.full_name} out everywhere?`}
                  description="Every browser and device they're signed in on will need to sign in again. Use this if a device is lost or shared."
                  confirmLabel="Sign out everywhere"
                  onConfirm={async () => {
                    const result = await signOutUserEverywhere(u.id);
                    if (result.ok) {
                      const n = result.data?.sessions ?? 0;
                      toast.success(
                        n === 0
                          ? `${u.full_name} had no active sessions`
                          : `${u.full_name} signed out of ${n} session${n === 1 ? "" : "s"}`,
                      );
                    } else toast.error(result.error);
                    return result.ok;
                  }}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
