import { cn } from "@/lib/utils";

// Tiny trend line for KPI cards. Pure SVG (no chart library, renders on the server).
// Colour comes from `currentColor`, so set it with a text-* class.

type SparklineProps = {
  points: readonly number[];
  className?: string;
  /** Fill the area under the line with a faint wash of the same colour. */
  area?: boolean;
};

const WIDTH = 96;
const HEIGHT = 28;
const PAD = 2;

export function Sparkline({ points, className, area = true }: SparklineProps) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = (WIDTH - PAD * 2) / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = PAD + i * stepX;
    const y = PAD + (HEIGHT - PAD * 2) * (1 - (p - min) / range);
    return [Number(x.toFixed(2)), Number(y.toFixed(2))] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const last = coords[coords.length - 1];
  const first = coords[0];
  const fill = `${line} L${last[0]} ${HEIGHT} L${first[0]} ${HEIGHT} Z`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      aria-hidden
      className={cn("shrink-0 overflow-visible text-chart-2", className)}
    >
      {area && <path d={fill} fill="currentColor" opacity={0.12} />}
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2} fill="currentColor" />
    </svg>
  );
}
