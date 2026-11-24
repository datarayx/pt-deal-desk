"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { DateText } from "@/components/common/date-text";
import { MoneyText } from "@/components/common/money-text";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import type { DealListRow } from "@/features/deals/queries";
import { dealOutcome } from "@/lib/status";

const linkClass =
  "hover:text-accent-ink hover:underline focus-visible:underline focus-visible:outline-none";

export const dealListColumns: ColumnDef<DealListRow>[] = [
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
  {
    accessorKey: "client_name",
    meta: { label: "Client", className: "max-w-56 truncate" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }) => (
      <Link href={`/clients/${row.original.client_id}`} className={linkClass}>
        {row.original.client_name}
      </Link>
    ),
  },
  {
    accessorKey: "financier_name",
    meta: { label: "Financier" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Financier" />,
  },
  {
    accessorKey: "facility_type",
    meta: { label: "Facility" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Facility" />,
  },
  {
    accessorKey: "stage_name",
    meta: { label: "Stage" },
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
    id: "amount",
    accessorFn: (row) => (row.amount === null ? null : Number(row.amount)),
    sortUndefined: "last",
    meta: { label: "Amount", align: "right", exportValue: (row) => row.amount },
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
    accessorKey: "days_in_stage",
    meta: { label: "Days in stage", align: "right" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Days" />,
    cell: ({ row }) => (
      <span className="num whitespace-nowrap">
        {row.original.days_in_stage}d
        {row.original.stale && <span className="ml-1 text-warning">•</span>}
      </span>
    ),
  },
  {
    accessorKey: "deficiency_count",
    meta: { label: "Deficiencies", align: "right" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Deficiencies" />,
    cell: ({ row }) =>
      row.original.deficiency_count > 0 ? (
        <Badge variant="warning">{row.original.deficiency_count}</Badge>
      ) : (
        <span className="num text-muted-foreground">0</span>
      ),
  },
  {
    accessorKey: "outcome",
    meta: { label: "Outcome", exportValue: (row) => dealOutcome[row.outcome].label },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Outcome" />,
    cell: ({ row }) => <StatusBadge status={dealOutcome[row.original.outcome]} />,
  },
  {
    accessorKey: "created_at",
    meta: { label: "Added" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Added" />,
    cell: ({ row }) => <DateText value={row.original.created_at} />,
  },
];
