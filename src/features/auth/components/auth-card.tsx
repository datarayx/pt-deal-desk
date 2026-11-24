import type * as React from "react";

import { cn } from "@/lib/utils";

/** The white card every sign-in screen sits in: heading, optional lead text, content. */
export function AuthCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full max-w-[440px] rounded-2xl border border-auth-border/80 bg-white p-6 shadow-[0_1px_2px_rgb(3_27_51/0.04),0_16px_40px_-16px_rgb(3_27_51/0.18)] sm:p-9",
        className,
      )}
    >
      <div className="space-y-2">
        <h1 className="text-[1.875rem] leading-9 font-semibold tracking-[-0.025em] text-auth-heading sm:text-[2rem] sm:leading-10">
          {title}
        </h1>
        {description && (
          <p className="text-[0.9375rem] leading-6 text-auth-subtle">{description}</p>
        )}
      </div>
      <div className="mt-7">{children}</div>
    </div>
  );
}
