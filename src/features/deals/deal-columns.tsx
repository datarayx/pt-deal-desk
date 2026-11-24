"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { DateText } from "@/components/common/date-text";
import { MoneyText } from "@/components/common/money-text";
import { StatusBadge } from "@/components/common/status-badge";
import { facetFilter } from "@/components/data-table/column-meta";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { dealOutcome } from "@/lib/status";

// Column builders for deal lists (partner detail pages now; the Deals table in task 2.6).
// Rows only need the fields each builder reads.

type DealBase = {
  id: string;
  reference: string;
  client_id: string;
  client_name: string;
  facility_type: string | null;
  stage_name: string;
  stage_color: string | null;
  outcome: keyof typeof dealOutcome;
  amount: string | null;
  amount_label: "requested" | "approved" | "disbursed" | null;
  disbursement_date: string | null;
  created_at: string;
};

const linkClass =
  "hover:text-accent-ink hover:underline focus-visible:underline focus-visible:outline-none";

export function dealColumns<T extends DealBase>(
  opts: { hide?: ("facility" | "client")[] } = {},
): ColumnDef<T>[] {
  const hide = new Set(opts.hide ?? []);
  const cols: ColumnDef<T>[] = [
    {
      accessorKey: "reference",
      meta: { label: "Deal" },
      enableHiding: false,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Deal" />,
      cell: ({ row }) => (
        <Link
          href={`/deals/${row.original.id}`}
          className={`num font-medium text-accent-ink ${linkClass}`}
        >
          {row.original.reference}
        </Link>
      ),
    },
  ];
  if (!hide.has("client")) {
    cols.push({
      accessorKey: "client_name",
      meta: { label: "Client", className: "max-w-56 truncate" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
      cell: ({ row }) => (
        <Link href={`/clients/${row.original.client_id}`} className={linkClass}>
          {row.original.client_name}
        </Link>
      ),
    });
  }
  if (!hide.has("facility")) {
    cols.push({
      accessorKey: "facility_type",
      meta: { label: "Facility" },
      filterFn: facetFilter<T>(),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Facility" />,
      cell: ({ row }) =>
        row.original.facility_type ?? <span className="text-muted-foreground">—</span>,
    });
  }
  cols.push(
    {
      accessorKey: "stage_name",
      meta: { label: "Stage" },
      filterFn: facetFilter<T>(),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stage" />,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full ring-1 ring-foreground/25"
            style={{ backgroundColor: row.original.stage_color ?? "var(--color-muted-foreground)" }}
            aria-hidden
          />
          {row.original.stage_name}
        </span>
      ),
    },
    {
      accessorKey: "outcome",
      meta: { label: "Outcome", exportValue: (r) => dealOutcome[r.outcome].label },
      filterFn: facetFilter<T>(),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Outcome" />,
      cell: ({ row }) => <StatusBadge status={dealOutcome[row.original.outcome]} />,
    },
    {
      id: "amount",
      accessorFn: (r) => (r.amount === null ? null : Number(r.amount)),
      sortUndefined: "last",
      meta: {
        label: "Amount",
        align: "right",
        exportValue: (r) => r.amount,
      },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ row }) => (
        <span className="inline-flex flex-col items-end leading-tight">
          <MoneyText value={row.original.amount} />
          {row.original.amount_label && (
            <span className="text-caption text-muted-foreground">{row.original.amount_label}</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "disbursement_date",
      sortUndefined: "last",
      meta: { label: "Disbursed on" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Disbursed" />,
      cell: ({ row }) => <DateText value={row.original.disbursement_date} />,
    },
  );
  return cols;
}

export const outcomeFacetOptions = (Object.keys(dealOutcome) as (keyof typeof dealOutcome)[]).map(
  (k) => ({ value: k, label: dealOutcome[k].label }),
);
