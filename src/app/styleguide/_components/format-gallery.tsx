import { DateText } from "@/components/common/date-text";
import { MoneyText } from "@/components/common/money-text";

const money = [
  { input: '"1250000"', node: <MoneyText value="1250000" /> },
  { input: '"-45000.5"', node: <MoneyText value="-45000.5" /> },
  { input: '"1284500000" compact', node: <MoneyText value="1284500000" compact /> },
  { input: '"2.675" (exact rounding)', node: <MoneyText value="2.675" /> },
  { input: "null", node: <MoneyText value={null} /> },
];

const dates = [
  { input: '"2026-11-23" (calendar date)', node: <DateText value="2026-11-23" /> },
  { input: '"2026-11-23T23:30:00Z" (Lagos day)', node: <DateText value="2026-11-23T23:30:00Z" /> },
  {
    input: '"2026-11-23T13:05:00Z" withTime',
    node: <DateText value="2026-11-23T13:05:00Z" withTime />,
  },
  { input: "null", node: <DateText value={null} /> },
];

export function FormatGallery() {
  return (
    <div className="grid gap-4 pt-4 md:grid-cols-2">
      {[
        { title: "MoneyText", rows: money },
        { title: "DateText", rows: dates },
      ].map((block) => (
        <div key={block.title} className="rounded-xl border border-border bg-card shadow-xs">
          <p className="border-b border-border px-4 py-2.5 text-small font-semibold">
            {block.title}
          </p>
          <dl className="divide-y divide-border">
            {block.rows.map((row) => (
              <div key={row.input} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt className="truncate font-mono text-caption text-muted-foreground">
                  {row.input}
                </dt>
                <dd className="text-right text-body">{row.node}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
