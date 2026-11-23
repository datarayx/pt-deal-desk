"use client";

import { BellIcon, CalendarClockIcon, HourglassIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Notification bell (SCREENS.md "Global"). STATIC PREVIEW: these sample alerts are placeholders
// until the reminders job and the `alerts` table land in tasks 4.1 / 4.2.

type SampleAlert = {
  id: string;
  kind: "overdue" | "due" | "stale";
  title: string;
  body: string;
  when: string;
  href: string;
  unread: boolean;
};

const sampleAlerts: readonly SampleAlert[] = [
  {
    id: "a1",
    kind: "overdue",
    title: "Instalment overdue 5 days",
    body: "Okeke Agro Processing Ltd · PT-2026-0027 · ₦6,800,000.00",
    when: "Today, 07:00",
    href: "/repayments",
    unread: true,
  },
  {
    id: "a2",
    kind: "due",
    title: "Repayment due in 3 days",
    body: "Zuma Rock Minerals Ltd · PT-2026-0031 · ₦14,250,000.00",
    when: "Today, 07:00",
    href: "/repayments",
    unread: true,
  },
  {
    id: "a3",
    kind: "stale",
    title: "Deal stale for 34 days",
    body: "Bello & Sons Logistics · still in Requirements",
    when: "Yesterday",
    href: "/deals",
    unread: false,
  },
];

const kindStyle = {
  overdue: { icon: TriangleAlertIcon, className: "bg-danger-soft text-danger-soft-foreground" },
  due: { icon: CalendarClockIcon, className: "bg-warning-soft text-warning-soft-foreground" },
  stale: { icon: HourglassIcon, className: "bg-neutral-soft text-neutral-soft-foreground" },
} as const;

export function NotificationBell() {
  const unread = sampleAlerts.filter((a) => a.unread).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <BellIcon />
          {unread > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-danger px-1 num text-[10px] leading-none font-semibold text-danger-foreground ring-2 ring-surface">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-body font-semibold">Notifications</p>
          <Button variant="link" size="sm" disabled className="h-auto px-0 text-small">
            Mark all read
          </Button>
        </div>
        <ul className="max-h-80 divide-y divide-border overflow-y-auto">
          {sampleAlerts.map((alert) => {
            const style = kindStyle[alert.kind];
            return (
              <li key={alert.id}>
                <Link
                  href={alert.href}
                  className="flex gap-3 px-4 py-3 transition-colors hover:bg-surface-subtle/60 focus-visible:outline-offset-[-2px]"
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
                      {alert.unread && (
                        <span className="size-1.5 shrink-0 rounded-full bg-info">
                          <span className="sr-only">Unread</span>
                        </span>
                      )}
                    </span>
                    <span className="block truncate num text-small text-muted-foreground">
                      {alert.body}
                    </span>
                    <span className="mt-0.5 block text-caption text-muted-foreground">
                      {alert.when}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-border bg-surface-subtle/50 px-4 py-2.5 text-caption text-muted-foreground">
          Sample alerts — live reminders arrive with the daily job.
        </p>
      </PopoverContent>
    </Popover>
  );
}
