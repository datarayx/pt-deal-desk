import { CircleAlertIcon, CircleCheckIcon, InfoIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

// Inline message above a sign-in form (fixed light palette, like the rest of the sign-in
// screens). role="alert" for errors so screen readers announce them on submit.
export function FormAlert({
  tone,
  children,
  className,
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = tone === "success" ? CircleCheckIcon : tone === "info" ? InfoIcon : CircleAlertIcon;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-[11px] border px-4 py-3 text-[0.9375rem] leading-6",
        tone === "error" && "border-[#f5c2bd] bg-[#fef3f2] text-[#912018]",
        tone === "success" && "border-[#a6e3d8] bg-[#ecfdf8] text-[#0b5c4f]",
        tone === "info" && "border-auth-border bg-auth-canvas text-auth-ink",
        className,
      )}
    >
      <Icon className="mt-1 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
