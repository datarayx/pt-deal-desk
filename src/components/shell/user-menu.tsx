"use client";

import {
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  SunMoonIcon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/lib/navigation";

export type ShellUser = { name: string; email: string; role: Role };

const roleLabel: Record<Role, string> = { ceo: "CEO", accountant: "Accountant" };

const noopSubscribe = () => () => {};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// User menu (SCREENS.md "Global"): profile, theme, sign out.
export function UserMenu({ user }: { user: ShellUser }) {
  const { theme, setTheme } = useTheme();
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-8 items-center justify-center rounded-full bg-brand text-caption font-semibold text-brand-foreground ring-2 ring-surface transition-opacity hover:opacity-90"
        aria-label={`Account menu for ${user.name}`}
      >
        {initials(user.name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-start justify-between gap-2 pt-2 pb-2">
          <span className="min-w-0">
            <span className="block truncate text-small font-semibold text-foreground">
              {user.name}
            </span>
            <span className="block truncate text-caption font-normal text-muted-foreground">
              {user.email}
            </span>
          </span>
          <Badge variant="accent" className="shrink-0">
            {roleLabel[user.role]}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {user.role === "ceo" && (
            <DropdownMenuItem asChild>
              <Link href="/settings/users">
                <UserRoundIcon /> Profile & users
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <SunMoonIcon /> Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-40">
              <DropdownMenuRadioGroup value={hydrated ? theme : undefined} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light">
                  <SunIcon /> Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <MoonIcon /> Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <MonitorIcon /> System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Sign-in arrives in task 0.4; until then there is no session to end. */}
        <DropdownMenuItem disabled>
          <LogOutIcon /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
