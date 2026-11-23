import { Suspense } from "react";
import type * as React from "react";

import { AppSidebarSkeleton } from "@/components/shell/app-sidebar-skeleton";
import { TopBarSkeleton } from "@/components/shell/top-bar-skeleton";
import { UserSidebar } from "@/components/shell/user-sidebar";
import { UserTopBar } from "@/components/shell/user-top-bar";

// Authenticated app shell (DESIGN.md §4): sidebar + top bar + content (max 1440px).
// The proxy guarantees a signed-in user with access to this path; the user-specific parts
// (role-filtered nav, name) read the session inside <Suspense> so pages stay prerendered.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-brand px-3 py-2 text-small font-medium text-brand-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh">
        <Suspense fallback={<AppSidebarSkeleton />}>
          <UserSidebar />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <Suspense fallback={<TopBarSkeleton />}>
            <UserTopBar />
          </Suspense>
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
