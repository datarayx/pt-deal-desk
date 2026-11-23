import type * as React from "react";

import { AppSidebar } from "@/components/shell/app-sidebar";
import { TopBar } from "@/components/shell/top-bar";
import type { ShellUser } from "@/components/shell/user-menu";

// Authenticated app shell (DESIGN.md §4): sidebar + top bar + content (max 1440px).
// Until sign-in lands (task 0.4) the shell shows a fictional demo CEO; 0.4/0.5 replace this with
// the signed-in profile and protect every route here by role.
const demoUser: ShellUser = {
  name: "Ngozi Adeyemi",
  email: "ceo@demo.ptdealdesk.ng",
  role: "ceo",
};

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
        <AppSidebar role={demoUser.role} homeHref="/dashboard" />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar user={demoUser} />
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
