import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

// Inline message above an auth form. role="alert" so screen readers announce it on submit.
export function FormAlert({
  tone,
  children,
  className,
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = tone === "success" ? CircleCheckIcon : CircleAlertIcon;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-2.5 rounded-lg border px-3 py-2.5 text-small",
        tone === "error" && "border-danger/20 bg-danger-soft text-danger-soft-foreground",
        tone === "success" && "border-success/20 bg-success-soft text-success-soft-foreground",
        tone === "info" && "border-info/20 bg-info-soft text-info-soft-foreground",
        className,
      )}
    >
      <Icon className="mt-px size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
