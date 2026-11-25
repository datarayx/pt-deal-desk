"use client";

import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

export type DemoAccount = { label: string; email: string; password: string };

/**
 * One-click sign-in for the demo accounts. Rendered only in demo mode (NEXT_PUBLIC_DEMO_MODE),
 * with credentials from the server environment — never hard-coded.
 */
export function DemoAccessCard({
  accounts,
  pendingEmail,
  disabled,
  onSignIn,
}: {
  accounts: readonly DemoAccount[];
  /** The account currently signing in, if any. */
  pendingEmail: string | null;
  disabled: boolean;
  onSignIn: (account: DemoAccount) => void;
}) {
  if (accounts.length === 0) return null;
  return (
    <section
      aria-labelledby="demo-access-title"
      className="rounded-xl border border-dashed border-[#c7d4e1] bg-[#f3f7fb] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="demo-access-title" className="text-sm font-medium text-auth-subtle">
          Demo access
        </h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-[0.6875rem] font-semibold tracking-[0.08em] text-auth-muted uppercase">
          Fictional data
        </span>
      </div>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {accounts.map((account) => {
          const pending = pendingEmail === account.email;
          return (
            <li
              key={account.email}
              className="flex min-w-0 flex-col rounded-lg border border-auth-border/80 bg-white p-3"
            >
              <div className="min-w-0">
                <p className="text-[0.9375rem] font-semibold text-auth-heading">{account.label}</p>
                <p className="mt-1 text-[0.75rem] leading-5 text-auth-subtle">
                  <span className="block truncate" title={account.email}>
                    {account.email}
                  </span>
                  <span className="block font-mono text-[0.72rem] [overflow-wrap:anywhere]">
                    <span className="sr-only">Password: </span>
                    {account.password}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSignIn(account)}
                disabled={disabled}
                aria-label={`Sign in as the demo ${account.label}`}
                aria-busy={pending || undefined}
                className={cn(
                  "mt-3 inline-flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-[9px] border border-auth-border bg-white px-3 text-[0.875rem] font-semibold text-auth-heading",
                  "shadow-[0_1px_2px_rgb(3_27_51/0.05)] transition-colors motion-reduce:transition-none",
                  "hover:border-[#c4d1de] hover:bg-auth-canvas active:bg-[#edf2f7]",
                  "focus-visible:ring-2 focus-visible:ring-auth-teal focus-visible:ring-offset-1 focus-visible:outline-none",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {pending && (
                  <Loader2Icon
                    className="size-4 animate-spin motion-reduce:animate-none"
                    aria-hidden
                  />
                )}
                Sign in
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
