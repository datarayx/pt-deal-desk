import { cn } from "@/lib/utils";
import Image from "next/image";

// The P&T mark on its navy tile (DESIGN.md: cyan/mint only ever sit on navy).
export function BrandMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-kpi-hero ring-1 ring-white/10",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/brand/mark.png"
        alt=""
        width={639}
        height={383}
        priority
        style={{ width: Math.round(size * 0.68), height: "auto" }}
      />
    </span>
  );
}
