import Link from "next/link";
import type * as React from "react";

import { BrandPanel } from "@/features/auth/components/brand-panel";
import { LogoMark } from "@/features/auth/components/logo-mark";

// Sign-in screens: brand story left (~57%), sign-in card right (~43%), one viewport tall on
// desktop. On phones and small tablets the card comes first and the brand story follows.
// Fixed light palette (auth-* tokens) whatever the app theme, so `color-scheme: light`.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid min-h-dvh bg-auth-canvas lg:h-dvh lg:min-h-[680px] lg:grid-cols-[minmax(0,57fr)_minmax(0,43fr)]"
      style={{ colorScheme: "light" }}
    >
      <BrandPanel className="order-2 lg:order-1" />

      <div className="order-1 flex min-w-0 flex-col bg-[radial-gradient(120%_70%_at_100%_0%,#eaf3fa_0%,#f7fafc_55%)] lg:order-2 lg:overflow-y-auto">
        <header className="px-5 pt-6 sm:px-10 sm:pt-8 lg:hidden">
          <Link
            href="/login"
            className="inline-flex rounded-lg focus-visible:ring-2 focus-visible:ring-auth-teal focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label="P&T Deal Desk sign in"
          >
            <LogoMark size={40} tone="on-light" />
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pt-8 pb-12 sm:px-10 lg:py-12">
          {children}
          <p className="text-sm text-auth-subtle">For authorised P&amp;T staff only.</p>
        </main>
      </div>
    </div>
  );
}
