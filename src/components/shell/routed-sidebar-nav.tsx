"use client";

import { usePathname } from "next/navigation";
import { type ComponentProps, Suspense } from "react";

import { SidebarNav } from "@/components/shell/sidebar-nav";

type RoutedSidebarNavProps = Omit<ComponentProps<typeof SidebarNav>, "pathname">;

// Reads the current path for the active highlight. Under Next 16 cacheComponents the path of a
// dynamic route (/clients/[id]) is unknown while the static shell is prerendered, so the read sits
// inside <Suspense>; the fallback is the same nav with nothing highlighted.
export function RoutedSidebarNav(props: RoutedSidebarNavProps) {
  return (
    <Suspense fallback={<SidebarNav pathname={null} {...props} />}>
      <CurrentSidebarNav {...props} />
    </Suspense>
  );
}

function CurrentSidebarNav(props: RoutedSidebarNavProps) {
  return <SidebarNav pathname={usePathname()} {...props} />;
}
