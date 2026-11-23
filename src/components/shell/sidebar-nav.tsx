"use client";

import Link from "next/link";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isActiveHref, type NavItem, type NavSection } from "@/lib/navigation";
import { cn } from "@/lib/utils";

// Navy sidebar navigation (DESIGN.md §2, §4). Active item: #0B2A47 with a 3px cyan left bar.
// mode="rail": desktop sidebar — collapses to icons (labels hidden, tooltips shown).
// mode="drawer": mobile drawer — always expanded.

type SidebarNavProps = {
  /** Current path, or null while it is still unknown (static shell) — then nothing is highlighted. */
  pathname: string | null;
  sections: readonly NavSection[];
  footer?: readonly NavItem[];
  mode: "rail" | "drawer";
  onNavigate?: () => void;
};

export function SidebarNav({ pathname, sections, footer = [], mode, onNavigate }: SidebarNavProps) {
  const rail = mode === "rail";

  const renderItem = (item: NavItem) => {
    const active = pathname !== null && isActiveHref(pathname, item.href);
    const Icon = item.icon;

    const link = (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group/nav-item relative flex h-8 items-center gap-3 rounded-md px-2.5 text-small font-medium text-sidebar-text transition-colors duration-100",
          "hover:bg-white/[0.06] hover:text-white",
          "focus-visible:outline-offset-0 focus-visible:outline-sidebar-indicator",
          active && [
            "bg-sidebar-active text-white hover:bg-sidebar-active",
            "before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r-full before:bg-sidebar-indicator",
          ],
          rail && "sidebar-collapsed:justify-center sidebar-collapsed:px-0",
        )}
      >
        <Icon
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-sidebar-text/80 group-hover/nav-item:text-white",
            active && "text-sidebar-indicator group-hover/nav-item:text-sidebar-indicator",
          )}
        />
        <span className={cn("truncate", rail && "sidebar-collapsed:sr-only")}>{item.title}</span>
      </Link>
    );

    if (!rail) return <li key={item.href}>{link}</li>;

    return (
      <li key={item.href}>
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          {/* Only needed when the labels are hidden */}
          <TooltipContent side="right" sideOffset={10} className="sidebar-expanded:hidden">
            {item.title}
          </TooltipContent>
        </Tooltip>
      </li>
    );
  };

  return (
    <nav aria-label="Main" className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {sections.map((section) => (
          <div key={section.id} className="space-y-1">
            {section.title && (
              <>
                <p
                  className={cn(
                    "px-2.5 pt-1 pb-1 text-caption font-medium text-sidebar-text/55",
                    rail && "sidebar-collapsed:hidden",
                  )}
                >
                  {section.title}
                </p>
                {rail && (
                  <div
                    aria-hidden
                    className="mx-2 mb-2 hidden h-px bg-white/10 sidebar-collapsed:block"
                  />
                )}
              </>
            )}
            <ul className="space-y-0.5">{section.items.map(renderItem)}</ul>
          </div>
        ))}
      </div>

      {footer.length > 0 && (
        <ul className="space-y-0.5 border-t border-white/[0.08] px-3 py-3">
          {footer.map(renderItem)}
        </ul>
      )}
    </nav>
  );
}
