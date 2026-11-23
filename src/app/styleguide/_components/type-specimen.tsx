import { MoneyText } from "@/components/common/money-text";

const scale = [
  { token: "text-display", spec: "30 / 36 · semibold", sample: "₦1,284,500,000.00", numeric: true },
  { token: "text-h1", spec: "24 / 32 · semibold", sample: "Deals" },
  { token: "text-h2", spec: "18 / 28 · semibold", sample: "Repayments due next 14 days" },
  {
    token: "text-body",
    spec: "14 / 20 · regular",
    sample: "Crestline Finance House approved the LPO facility.",
  },
  { token: "text-small", spec: "13 / 18 · regular", sample: "Last updated by Adaeze Okafor" },
  { token: "text-caption", spec: "12 / 16 · muted", sample: "OUTSTANDING BALANCE", muted: true },
] as const;

export function TypeSpecimen() {
  return (
    <div className="space-y-5">
      <div className="divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
        {scale.map((row) => (
          <div
            key={row.token}
            className="grid gap-1 px-4 py-3 sm:grid-cols-[160px_1fr] sm:items-baseline"
          >
            <div>
              <code className="font-mono text-small">{row.token}</code>
              <p className="text-caption text-muted-foreground">{row.spec}</p>
            </div>
            <p
              className={[
                row.token,
                "truncate",
                "numeric" in row && row.numeric ? "num" : "",
                "muted" in row && row.muted ? "text-muted-foreground" : "text-foreground",
              ].join(" ")}
            >
              {row.sample}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className="mb-2 text-caption font-medium text-muted-foreground">
            Proportional figures (avoid for numbers)
          </p>
          <div
            className="space-y-1 text-right text-body"
            style={{ fontVariantNumeric: "proportional-nums" }}
          >
            <p>₦1,111,111.11</p>
            <p>₦8,888,888.88</p>
            <p>₦45,000,000.00</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className="mb-2 text-caption font-medium text-muted-foreground">
            Tabular figures — <code className="font-mono">num</code> utility
          </p>
          <div className="space-y-1 text-right text-body">
            <p>
              <MoneyText value="1111111.11" />
            </p>
            <p>
              <MoneyText value="8888888.88" />
            </p>
            <p>
              <MoneyText value="45000000.00" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
