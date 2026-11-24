"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { LandmarkIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { MoneyText } from "@/components/common/money-text";
import { facetFilter, type FacetDef } from "@/components/data-table/column-meta";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { selectColumn } from "@/components/data-table/select-column";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FinancierSheet } from "@/features/financiers/components/financier-sheet";
import type { FinancierListRow } from "@/features/financiers/queries";
import { FINANCIER_TYPES, financierTypeLabel } from "@/features/financiers/schemas";
import type { SavedView } from "@/features/saved-views/schemas";
import { formatRate, formatRateRange } from "@/lib/format/rate";

const columns: ColumnDef<FinancierListRow>[] = [
  selectColumn<FinancierListRow>(),
  {
    accessorKey: "name",
    meta: { label: "Name" },
    enableHiding: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <Link
        href={`/financiers/${row.original.id}`}
        className="font-medium text-foreground hover:text-accent-ink hover:underline focus-visible:underline focus-visible:outline-none"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "financier_type",
    meta: { label: "Type", exportValue: (r) => financierTypeLabel[r.financier_type] },
    filterFn: facetFilter<FinancierListRow>(),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {financierTypeLabel[row.original.financier_type]}
      </span>
    ),
  },
  {
    id: "rate",
    accessorFn: (r) => (r.rate_min_monthly === null ? null : Number(r.rate_min_monthly)),
    sortUndefined: "last",
    meta: {
      label: "Rate per month",
      exportValue: (r) =>
        formatRateRange(r.rate_min_monthly, r.rate_max_monthly)?.replace(" per month", "") ?? "",
    },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rate / month" />,
    cell: ({ row }) => {
      const lo = formatRate(row.original.rate_min_monthly);
      const hi = formatRate(row.original.rate_max_monthly);
      if (!lo && !hi) return <span className="text-muted-foreground">—</span>;
      return <span className="num">{lo && hi && lo !== hi ? `${lo} – ${hi}` : (lo ?? hi)}</span>;
    },
  },
  {
    accessorKey: "facility_types",
    meta: { label: "Facility types" },
    enableSorting: false,
    filterFn: facetFilter<FinancierListRow>(),
    header: "Facility types",
    cell: ({ row }) => {
      const types = row.original.facility_types;
      if (types.length === 0) return <span className="text-muted-foreground">—</span>;
      return (
        <span className="flex items-center gap-1" title={types.join(", ")}>
          <Badge variant="outline">{types[0]}</Badge>
          {types.length > 1 && <Badge variant="outline">+{types.length - 1}</Badge>}
        </span>
      );
    },
  },
  {
    accessorKey: "deal_count",
    meta: { label: "Deals", align: "right" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Deals" />,
    cell: ({ row }) => <span className="num">{row.original.deal_count}</span>,
  },
  {
    accessorKey: "pipeline_count",
    meta: { label: "In pipeline", align: "right" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="In pipeline" />,
    cell: ({ row }) => <span className="num">{row.original.pipeline_count}</span>,
  },
  {
    id: "total_disbursed",
    // Sort on the number; display and export use the exact decimal string.
    accessorFn: (r) => Number(r.total_disbursed),
    meta: { label: "Total disbursed", align: "right", exportValue: (r) => r.total_disbursed },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Disbursed" />,
    cell: ({ row }) => <MoneyText value={row.original.total_disbursed} />,
  },
  {
    accessorKey: "requirement_count",
    meta: { label: "Checklist items", align: "right" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Checklist" />,
    cell: ({ row }) => <span className="num">{row.original.requirement_count}</span>,
  },
  {
    accessorKey: "contact_person",
    meta: { label: "Contact" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contact" />,
    cell: ({ row }) =>
      row.original.contact_person ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: "phone",
    meta: { label: "Phone" },
    enableSorting: false,
    header: "Phone",
    cell: ({ row }) => <span className="num">{row.original.phone ?? "—"}</span>,
  },
  {
    accessorKey: "email",
    meta: { label: "Email" },
    enableSorting: false,
    header: "Email",
    cell: ({ row }) => row.original.email ?? <span className="text-muted-foreground">—</span>,
  },
];

const DEFAULT_HIDDEN = ["contact_person", "phone", "email"];

export function FinanciersTable({
  financiers,
  facilityTypeNames,
  savedViews,
}: {
  financiers: FinancierListRow[];
  facilityTypeNames: string[];
  savedViews: SavedView[];
}) {
  const allFacilities = [
    ...new Set([...facilityTypeNames, ...financiers.flatMap((f) => f.facility_types)]),
  ];
  const facets: FacetDef[] = [
    {
      columnId: "financier_type",
      title: "Type",
      options: FINANCIER_TYPES.map((t) => ({ value: t, label: financierTypeLabel[t] })),
    },
    {
      columnId: "facility_types",
      title: "Facility type",
      options: allFacilities.sort().map((n) => ({ value: n, label: n })),
    },
  ];

  return (
    <DataTable
      tableKey="financiers"
      label="Financiers"
      columns={columns}
      data={financiers}
      getRowId={(r) => r.id}
      searchText={(r) => [r.name, r.contact_person, r.email, ...r.facility_types].join(" ")}
      searchPlaceholder="Search financiers…"
      facets={facets}
      savedViews={savedViews}
      rowHref={(r) => `/financiers/${r.id}`}
      exportName="financiers"
      initialSorting={[{ id: "name", desc: false }]}
      initialHidden={DEFAULT_HIDDEN}
      emptyState={
        <EmptyState
          icon={<LandmarkIcon />}
          title="No financiers yet"
          description="Add the finance houses and banks you place deals with, and their requirement checklists."
          action={
            <FinancierSheet
              facilityTypeNames={facilityTypeNames}
              trigger={
                <Button>
                  <PlusIcon /> Add financier
                </Button>
              }
            />
          }
        />
      }
    />
  );
}
