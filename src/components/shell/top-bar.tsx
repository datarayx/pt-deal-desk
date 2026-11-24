import { Suspense } from "react";

import { CommandPalette } from "@/components/shell/command-palette";
import { MobileNav } from "@/components/shell/mobile-nav";
import { NotificationBell } from "@/components/shell/notification-bell";
import { PageTitle } from "@/components/shell/page-title";
import { type ShellUser, UserMenu } from "@/components/shell/user-menu";
import { getBellAlerts } from "@/features/alerts/queries";

// Top bar (DESIGN.md §4): breadcrumb · search ⌘K · bell · user menu. Menu button on mobile.
export async function TopBar({ user }: { user: ShellUser }) {
  const { alerts, unreadCount } = await getBellAlerts();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
      <MobileNav role={user.role} />
      <div className="min-w-0 flex-1">
        {/* The breadcrumb reads the path, unknown for dynamic routes during prerender */}
        <Suspense fallback={null}>
          <PageTitle />
        </Suspense>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <CommandPalette role={user.role} />
        <NotificationBell initialAlerts={alerts} initialUnreadCount={unreadCount} />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
