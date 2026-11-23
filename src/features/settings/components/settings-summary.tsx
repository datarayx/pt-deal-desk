import type * as React from "react";

/** Read-only key/value rows for a settings card; editing happens in a side sheet. */
export function SettingsSummary({
  rows,
}: {
  rows: { label: string; value: React.ReactNode; hint?: string }[];
}) {
  return (
    <dl className="divide-y divide-border">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid gap-1 px-5 py-3.5 sm:grid-cols-[minmax(0,16rem)_1fr] sm:gap-6"
        >
          <dt className="text-small text-muted-foreground">
            {row.label}
            {row.hint && <span className="block text-caption">{row.hint}</span>}
          </dt>
          <dd className="text-body">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
