import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { SIDEBAR_RESTORE_SCRIPT } from "@/components/shell/sidebar-restore-script";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "P&T Deal Desk",
    template: "%s · P&T Deal Desk",
  },
  description: "Clients, deals, repayments and books for P&T Finance Consult Limited.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#06121f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: next-themes and the sidebar script set attributes on <html>
    // before React hydrates
    <html lang="en-NG" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
        {/* Restores the collapsed sidebar before first paint. `beforeInteractive` must live in
            the root layout; Next injects it into <head> ahead of all app code. */}
        <Script id="sidebar-state" strategy="beforeInteractive">
          {SIDEBAR_RESTORE_SCRIPT}
        </Script>
      </body>
    </html>
  );
}

