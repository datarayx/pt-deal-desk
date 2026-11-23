import Link from "next/link";
import type * as React from "react";

import { BrandMark } from "@/components/common/brand-mark";
import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";

// Split layout for sign-in screens (SCREENS.md "Auth"): form left, brand panel right.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/login" className="flex w-fit items-center gap-2.5 rounded-md">
          <BrandMark size={32} />
          <span className="text-body font-semibold">P&amp;T Deal Desk</span>
        </Link>

        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <p className="text-caption text-muted-foreground">For authorised P&amp;T staff only.</p>
      </div>
      <AuthBrandPanel />
    </div>
  );
}
