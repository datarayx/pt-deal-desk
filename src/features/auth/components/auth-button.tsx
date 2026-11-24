import { Loader2Icon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

/** Full-width deep-navy primary button for the sign-in screens (52px, all states). */
export function AuthButton({
  pending = false,
  pendingLabel,
  children,
  className,
  disabled,
  ...props
}: React.ComponentProps<"button"> & { pending?: boolean; pendingLabel?: string }) {
  return (
    <button
      {...props}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(
        "relative inline-flex h-13 w-full items-center justify-center gap-2 rounded-[11px] bg-auth-navy px-5 text-base font-semibold text-white",
        "shadow-[0_1px_2px_rgb(3_27_51/0.2),inset_0_1px_0_rgb(255_255_255/0.06)]",
        "transition-[background-color,transform,box-shadow] duration-150 motion-reduce:transition-none",
        "hover:bg-auth-navy-2 hover:shadow-[0_6px_16px_-6px_rgb(3_27_51/0.45)]",
        "active:translate-y-px active:bg-[#021426] motion-reduce:active:translate-y-0",
        "focus-visible:ring-2 focus-visible:ring-auth-teal focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:bg-auth-navy/70 disabled:shadow-none",
        className,
      )}
    >
      {pending && (
        <Loader2Icon className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
      )}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
