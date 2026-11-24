import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The P&T Deal Desk mark: the official cyan/aqua open-box mark (public/brand/mark.png) on a navy
 * rounded tile, optionally with the wordmark. `tone` sets the wordmark colour for navy or light
 * backgrounds.
 */
export function LogoMark({
  size = 44,
  withWordmark = true,
  tone = "on-navy",
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  tone?: "on-navy" | "on-light";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className="relative inline-flex shrink-0 items-center justify-center rounded-[28%] bg-gradient-to-br from-auth-navy-2 to-auth-navy shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_6px_18px_-6px_rgb(0_230_208/0.45)] ring-1 ring-white/10"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <Image
          src="/brand/mark.png"
          alt=""
          width={639}
          height={383}
          priority
          style={{ width: Math.round(size * 0.66), height: "auto" }}
        />
      </span>
      {withWordmark && (
        <span
          className={cn(
            "text-lg font-semibold tracking-[-0.01em]",
            tone === "on-navy" ? "text-white" : "text-auth-heading",
          )}
        >
          P&amp;T Deal Desk
        </span>
      )}
    </span>
  );
}
