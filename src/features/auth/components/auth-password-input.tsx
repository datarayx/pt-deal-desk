"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import type * as React from "react";

import { authInputClass } from "@/features/auth/components/form-field";
import { cn } from "@/lib/utils";

/** Password input with an accessible show/hide toggle. Works with password managers and paste. */
export function AuthPasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn(authInputClass, "pr-13", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={props.id}
        className={cn(
          "absolute top-1/2 right-1.5 flex size-11 -translate-y-1/2 items-center justify-center rounded-[9px] text-auth-muted",
          "transition-colors hover:bg-auth-canvas hover:text-auth-ink motion-reduce:transition-none",
          "focus-visible:ring-2 focus-visible:ring-auth-teal focus-visible:outline-none",
        )}
      >
        {visible ? (
          <EyeOffIcon className="size-5" aria-hidden />
        ) : (
          <EyeIcon className="size-5" aria-hidden />
        )}
      </button>
    </div>
  );
}
