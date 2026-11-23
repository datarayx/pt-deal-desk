"use client";

import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { BrandMark } from "@/components/common/brand-mark";
import { RoutedSidebarNav } from "@/components/shell/routed-sidebar-nav";
import { setSidebarCollapsed, useSidebarCollapsed } from "@/components/shell/sidebar-state";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useModifierKey } from "@/hooks/use-modifier-key";
import { footerNavForRole, type Role, sectionsForRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";

// Desktop sidebar (DESIGN.md §4): 240px, collapsible to a 64px icon rail. Hidden below md,
// where <MobileNav> provides the same navigation in a drawer.

type AppSidebarProps = {
  role: Role;
  homeHref: string;
};

export function AppSidebar({ role, homeHref }: AppSidebarProps) {
  const sections = sectionsForRole(role);
  const footer = footerNavForRole(role);
  const collapsed = useSidebarCollapsed();
  const modifier = useModifierKey();

  // Ctrl/⌘ + B toggles the sidebar
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "b" && (event.metaKey || event.ctrlKey) && !event.altKey) {
        event.preventDefault();
        setSidebarCollapsed(!document.documentElement.hasAttribute("data-sidebar-collapsed"));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const ToggleIcon = collapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon;
  const toggleLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <aside
      aria-label="Sidebar"
      className={cn(
        "sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-text md:flex",
        "transition-[width] duration-200 ease-out sidebar-collapsed:w-16",
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-4 sidebar-collapsed:justify-center sidebar-collapsed:px-0">
        <Link
          href={homeHref}
          className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-sidebar-indicator"
        >
          <BrandMark size={28} />
          <span className="truncate text-body font-semibold text-white sidebar-collapsed:sr-only">
            P&amp;T Deal Desk
          </span>
        </Link>
      </div>

      <RoutedSidebarNav sections={sections} footer={footer} mode="rail" />

      <div className="shrink-0 border-t border-white/[0.08] px-3 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!collapsed)}
              aria-label={toggleLabel}
              aria-expanded={!collapsed}
              className={cn(
                "flex h-8 w-full items-center gap-3 rounded-md px-2.5 text-small text-sidebar-text/70",
                "hover:bg-white/[0.06] hover:text-white focus-visible:outline-offset-0 focus-visible:outline-sidebar-indicator",
                "sidebar-collapsed:justify-center sidebar-collapsed:px-0",
              )}
            >
              <ToggleIcon className="size-4 shrink-0" aria-hidden />
              <span className="sidebar-collapsed:sr-only">Collapse</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            {toggleLabel}
            <span className="flex gap-0.5">
              <Kbd className="h-4 min-w-4 border-0 bg-background/15 text-background">
                {modifier}
              </Kbd>
              <Kbd className="h-4 min-w-4 border-0 bg-background/15 text-background">B</Kbd>
            </span>
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
