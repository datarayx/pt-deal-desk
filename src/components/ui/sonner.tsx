"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import type * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// Toasts (DESIGN.md §5): raised surface, hairline border, status shown by a coloured icon + text.
// Usage: import { toast } from "sonner"; toast.success("Repayment confirmed").
function Toaster({ ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={(resolvedTheme as ToasterProps["theme"]) ?? "system"}
      position="bottom-right"
      gap={8}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" />,
        info: <InfoIcon className="size-4 text-info" />,
        warning: <TriangleAlertIcon className="size-4 text-warning" />,
        error: <OctagonXIcon className="size-4 text-danger" />,
        loading: <Loader2Icon className="size-4 animate-spin text-muted-foreground" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "12px",
          "--width": "380px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "shadow-md! gap-3! px-4! py-3! font-sans",
          title: "text-body! font-medium!",
          description: "text-small! text-muted-foreground!",
          actionButton:
            "h-7! rounded-md! bg-brand! px-2.5! text-small! font-medium! text-brand-foreground!",
          cancelButton:
            "h-7! rounded-md! bg-surface-subtle! px-2.5! text-small! font-medium! text-foreground!",
          closeButton: "border-border! bg-popover! text-muted-foreground!",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
