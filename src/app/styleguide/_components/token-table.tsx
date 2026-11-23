import { cn } from "@/lib/utils";

import type { TokenGroup } from "../_data/tokens";

function Swatch({
  name,
  mode,
  onNavy,
}: {
  name: string;
  mode: "light" | "dark";
  onNavy?: boolean;
}) {
  return (
    <span
      className={cn(
        mode,
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border",
        onNavy ? "bg-kpi-hero" : "bg-background",
      )}
    >
      <span
        className="size-6 rounded-md ring-1 ring-black/5 ring-inset"
        style={{ background: `var(--${name})` }}
      />
    </span>
  );
}

export function TokenTable({ group }: { group: TokenGroup }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-3">
        <h3 className="text-body font-semibold">{group.title}</h3>
        {group.note && <p className="text-small text-muted-foreground">{group.note}</p>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed text-body">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col />
          </colgroup>
          <thead>
            <tr className="text-left text-caption text-muted-foreground">
              <th className="px-4 py-2 font-medium">Token</th>
              <th className="px-4 py-2 font-medium">Light</th>
              <th className="px-4 py-2 font-medium">Dark</th>
              <th className="px-4 py-2 font-medium">Use</th>
            </tr>
          </thead>
          <tbody>
            {group.tokens.map((token) => (
              <tr key={token.name} className="border-t border-border">
                <td className="px-4 py-2.5">
                  <code className="font-mono text-small">--{token.name}</code>
                </td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-3">
                    <Swatch name={token.name} mode="light" onNavy={token.onNavy} />
                    <span className="font-mono num text-small text-muted-foreground">
                      {token.light}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-3">
                    <Swatch name={token.name} mode="dark" onNavy={token.onNavy} />
                    <span className="font-mono num text-small text-muted-foreground">
                      {token.dark}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-small text-muted-foreground">{token.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
