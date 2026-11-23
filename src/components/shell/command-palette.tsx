"use client";

import {
  CalendarPlusIcon,
  FileSpreadsheetIcon,
  MonitorIcon,
  MoonIcon,
  PhoneCallIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
  UserPlusIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { useModifierKey } from "@/hooks/use-modifier-key";
import { footerNavForRole, type Role, sectionsForRole, settingsNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

// ⌘K / Ctrl+K palette (DESIGN.md §5): jump to any page, quick actions, theme.
// Searching clients and deals by name is added once the data exists (tasks 2.4 / 2.6).

type QuickAction = { label: string; href: string; icon: typeof PlusIcon; roles: readonly Role[] };

const quickActions: readonly QuickAction[] = [
  { label: "New client", href: "/clients/new", icon: UserPlusIcon, roles: ["ceo"] },
  { label: "New deal", href: "/deals?new=1", icon: PlusIcon, roles: ["ceo"] },
  {
    label: "Record a reported repayment",
    href: "/repayments",
    icon: CalendarPlusIcon,
    roles: ["ceo"],
  },
  { label: "Log a call", href: "/follow-ups", icon: PhoneCallIcon, roles: ["ceo"] },
  {
    label: "Run trial balance",
    href: "/finance/reports",
    icon: FileSpreadsheetIcon,
    roles: ["ceo", "accountant"],
  },
];

type CommandPaletteProps = { role: Role };

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function CommandPalette({ role }: CommandPaletteProps) {
  const sections = sectionsForRole(role);
  const footer = footerNavForRole(role);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();
  const modifier = useModifierKey();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isK = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      const isSlash = event.key === "/" && !isTypingTarget(event.target);
      if (isK || isSlash) {
        event.preventDefault();
        setOpen((value) => (isK ? !value : true));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  const pages = [
    ...sections.map((s) => ({ heading: s.title ?? "Pages", items: s.items })),
    { heading: "More", items: footer },
    ...(role === "ceo" ? [{ heading: "Settings", items: settingsNav }] : []),
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search or jump to"
        aria-keyshortcuts="Control+K Meta+K"
        className={cn(
          "inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 text-small text-muted-foreground shadow-xs",
          "transition-colors hover:border-border-strong hover:text-foreground",
          "w-8 justify-center sm:w-64 sm:justify-start",
        )}
      >
        <SearchIcon className="size-4 shrink-0" aria-hidden />
        <span className="hidden flex-1 text-left sm:inline">Search or jump to…</span>
        <span className="hidden items-center gap-0.5 sm:flex" aria-hidden>
          <Kbd>{modifier}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a page or action…" />
        <CommandList>
          <CommandEmpty>No matches. Try “deals”, “trial balance” or “settings”.</CommandEmpty>

          <CommandGroup heading="Quick actions">
            {quickActions
              .filter((a) => a.roles.includes(role))
              .map((action) => (
                <CommandItem
                  key={action.label}
                  value={`action ${action.label}`}
                  onSelect={() => run(() => router.push(action.href))}
                >
                  <action.icon />
                  {action.label}
                </CommandItem>
              ))}
          </CommandGroup>

          <CommandSeparator />

          {pages.map((group) => (
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`${group.heading} ${item.title} ${item.keywords?.join(" ") ?? ""}`}
                  onSelect={() => run(() => router.push(item.href))}
                >
                  <item.icon />
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

          <CommandSeparator />

          <CommandGroup heading="Theme">
            <CommandItem value="theme light mode" onSelect={() => run(() => setTheme("light"))}>
              <SunIcon /> Light theme
            </CommandItem>
            <CommandItem value="theme dark mode" onSelect={() => run(() => setTheme("dark"))}>
              <MoonIcon /> Dark theme
            </CommandItem>
            <CommandItem value="theme system" onSelect={() => run(() => setTheme("system"))}>
              <MonitorIcon /> Use system theme
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <div className="flex items-center gap-4 border-t border-border bg-surface-subtle/50 px-4 py-2 text-caption text-muted-foreground">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> to move
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Enter</Kbd> to open
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd> to close
          </span>
        </div>
      </CommandDialog>
    </>
  );
}
