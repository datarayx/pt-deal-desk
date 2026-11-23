"use client";

import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { BrandMark } from "@/components/common/brand-mark";
import { RoutedSidebarNav } from "@/components/shell/routed-sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { footerNavForRole, type Role, sectionsForRole } from "@/lib/navigation";

// Below md the sidebar becomes a drawer (DESIGN.md §7), opened from the top bar.
export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const sections = sectionsForRole(role);
  const footer = footerNavForRole(role);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 border-0 bg-sidebar text-sidebar-text data-[side=left]:w-72 [&>[data-slot=sheet-close]]:text-sidebar-text [&>[data-slot=sheet-close]]:hover:bg-white/10 [&>[data-slot=sheet-close]]:hover:text-white"
      >
        <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
          <BrandMark size={28} />
          <SheetTitle className="text-body font-semibold text-white">P&amp;T Deal Desk</SheetTitle>
          <SheetDescription className="sr-only">Main navigation</SheetDescription>
        </div>
        <RoutedSidebarNav
          sections={sections}
          footer={footer}
          mode="drawer"
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
