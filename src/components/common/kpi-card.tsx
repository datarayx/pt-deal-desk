import { cn } from "@/lib/utils";
import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import type * as React from "react";

import { Sparkline } from "@/components/common/sparkline";

// DESIGN.md §5: label (caption, muted) · value (Display, tabular) · delta or sub-line · sparkline.
// variant="hero" is the signature navy card: white value, delta in growth mint.
// Use the hero variant for exactly ONE figure per screen (the most important one).

export type KpiDelta = {
  /** Already formatted, e.g. "+12.4%" or "₦3.2M". */
  value: string;
  trend: "up" | "down" | "flat";
  /** Whether this movement is good news. Defaults: up = positive, down = negative. */
  intent?: "positive" | "negative" | "neutral";
  /** Comparison period, e.g. "vs last month". */
  label?: string;
};

type KpiCardProps = {
  label: string;
  value: React.ReactNode;
  delta?: KpiDelta;
  /** Secondary line when there is no delta, e.g. "12 instalments". */
  sub?: React.ReactNode;
  sparkline?: readonly number[];
  variant?: "default" | "hero";
  className?: string;
};

const trendIcon = {
  up: ArrowUpRightIcon,
  down: ArrowDownRightIcon,
  flat: ArrowRightIcon,
} as const;

const deltaTone = {
  default: {
    positive: "text-success",
    negative: "text-danger",
    neutral: "text-muted-foreground",
  },
  hero: {
    positive: "text-kpi-hero-delta",
    negative: "text-kpi-hero-negative",
    neutral: "text-kpi-hero-muted",
  },
} as const;

function deltaIntent(delta: KpiDelta): "positive" | "negative" | "neutral" {
  if (delta.intent) return delta.intent;
  if (delta.trend === "flat") return "neutral";
  return delta.trend === "up" ? "positive" : "negative";
}

export function KpiCard({
  label,
  value,
  delta,
  sub,
  sparkline,
  variant = "default",
  className,
}: KpiCardProps) {
  const hero = variant === "hero";
  const intent = delta ? deltaIntent(delta) : "neutral";
  const TrendIcon = delta ? trendIcon[delta.trend] : null;

  return (
    <section
      aria-label={label}
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-xl border p-5",
        hero
          ? "border-transparent bg-kpi-hero text-kpi-hero-foreground"
          : "border-border bg-card text-card-foreground shadow-xs",
        className,
      )}
    >
      <p
        className={cn(
          "text-caption font-medium",
          hero ? "text-kpi-hero-muted" : "text-muted-foreground",
        )}
      >
        {label}
      </p>

      <div className="flex items-end justify-between gap-3">
        <div className="truncate num text-display">{value}</div>
        {sparkline && (
          <Sparkline points={sparkline} className={cn("mb-1", hero && "text-brand-cyan")} />
        )}
      </div>

      {(delta || sub) && (
        <div className="flex min-h-4 items-center gap-1.5 text-caption">
          {delta && TrendIcon && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 num font-medium",
                deltaTone[variant][intent],
              )}
            >
              <TrendIcon className="size-3.5" aria-hidden />
              {delta.value}
            </span>
          )}
          {delta?.label && (
            <span className={hero ? "text-kpi-hero-muted" : "text-muted-foreground"}>
              {delta.label}
            </span>
          )}
          {!delta && sub && (
            <span className={hero ? "text-kpi-hero-muted" : "text-muted-foreground"}>{sub}</span>
          )}
        </div>
      )}
    </section>
  );
}
