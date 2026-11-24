"use client";

import {
  BellIcon,
  CalendarClockIcon,
  HourglassIcon,
  MailIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { markAlertRead, markAllAlertsRead } from "@/features/alerts/actions";
import type { BellAlert } from "@/features/alerts/queries";
import { formatDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";

const kindStyle = {
  due_soon: { icon: CalendarClockIcon, className: "bg-warning-soft text-warning-soft-foreground" },
  due_today: { icon: CalendarClockIcon, className: "bg-warning-soft text-warning-soft-foreground" },
  overdue: { icon: TriangleAlertIcon, className: "bg-danger-soft text-danger-soft-foreground" },
  stale_deal: { icon: HourglassIcon, className: "bg-neutral-soft text-neutral-soft-foreground" },
  system: { icon: MailIcon, className: "bg-info-soft text-info-soft-foreground" },
} as const;

export function NotificationBell({
  initialAlerts,
  initialUnreadCount,
}: {
  initialAlerts: BellAlert[];
  initialUnreadCount: number;
}) {
  const router = useRouter();
  const [alerts, setAlerts] = useState(initialAlerts);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [pending, startTransition] = useTransition();

  function openAlert(alert: BellAlert) {
    startTransition(async () => {
      if (!alert.read_at) {
        const result = await markAlertRead(alert.id);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setAlerts((current) =>
          current.map((item) =>
            item.id === alert.id ? { ...item, read_at: new Date().toISOString() } : item,
          ),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      router.push(alert.link ?? "/outbox");
    });
  }

  function markAllRead() {
    startTransition(async () => {
      const result = await markAllAlertsRead();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setAlerts((current) =>
        current.map((alert) => ({ ...alert, read_at: alert.read_at ?? new Date().toISOString() })),
      );
      setUnreadCount(0);
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-danger px-1 num text-[10px] leading-none font-semibold text-danger-foreground ring-2 ring-surface">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-body font-semibold">Notifications</p>
          <Button
            variant="link"
            size="sm"
            disabled={pending || unreadCount === 0}
            onClick={markAllRead}
            className="h-auto px-0 text-small"
          >
            Mark all read
          </Button>
        </div>
        {alerts.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <BellIcon className="mx-auto size-5 text-muted-foreground" aria-hidden />
            <p className="mt-2 text-small font-medium">You&apos;re all caught up</p>
            <p className="mt-1 text-caption text-muted-foreground">
              New reminders will appear here.
            </p>
          </div>
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {alerts.map((alert) => {
              const style = kindStyle[alert.kind];
              return (
                <li key={alert.id}>
                  <button
                    type="button"
                    onClick={() => openAlert(alert)}
                    disabled={pending}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-subtle/60 focus-visible:outline-offset-[-2px]",
                      !alert.read_at && "bg-accent-soft/20",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md [&_svg]:size-3.5",
                        style.className,
                      )}
                    >
                      <style.icon />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-small font-medium text-foreground">
                          {alert.title}
                        </span>
                        {!alert.read_at && (
                          <span className="size-1.5 shrink-0 rounded-full bg-info">
                            <span className="sr-only">Unread</span>
                          </span>
                        )}
                      </span>
                      {alert.body && (
                        <span className="block truncate num text-small text-muted-foreground">
                          {alert.body}
                        </span>
                      )}
                      <span className="mt-0.5 block text-caption text-muted-foreground">
                        {formatDate(alert.created_at, { withTime: true }) ?? "Recently"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="border-t border-border bg-surface-subtle/50 px-4 py-2.5 text-caption text-muted-foreground">
          Reminder emails stay in Outbox while demo mode is enabled.
        </p>
      </PopoverContent>
    </Popover>
  );
}
