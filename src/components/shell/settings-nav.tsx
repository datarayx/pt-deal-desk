"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { settingsNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

// Settings sub-navigation: vertical list on desktop, horizontal scroller on small screens.
export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings"
      className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0"
    >
      <ul className="flex gap-1 lg:flex-col">
        {settingsNav.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-small font-medium whitespace-nowrap text-muted-foreground transition-colors",
                  "hover:bg-surface-subtle hover:text-foreground",
                  active &&
                    "bg-surface text-foreground shadow-xs ring-1 ring-border hover:bg-surface",
                )}
              >
                <item.icon
                  aria-hidden
                  className={cn(
                    "size-4 shrink-0",
                    active ? "text-accent-ink" : "text-muted-foreground",
                  )}
                />
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
