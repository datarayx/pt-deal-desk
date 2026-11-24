"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { UsersIcon } from "lucide-react";
import Link from "next/link";

import { DateText } from "@/components/common/date-text";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { facetFilter } from "@/components/data-table/column-meta";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { ReferredClientRow } from "@/features/referrers/queries";
import { kycStatus } from "@/lib/status";

const clientTypeLabel = { individual: "Individual", company: "Company" } as const;

const columns: ColumnDef<ReferredClientRow>[] = [
  {
    accessorKey: "display_name",
    meta: { label: "Client" },
    enableHiding: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }) => (
      <Link
        href={`/clients/${row.original.id}`}
        className="font-medium hover:text-accent-ink hover:underline focus-visible:underline focus-visible:outline-none"
      >
        {row.original.display_name}
      </Link>
    ),
  },
  {
    accessorKey: "client_type",
    meta: { label: "Type", exportValue: (r) => clientTypeLabel[r.client_type] },
    filterFn: facetFilter<ReferredClientRow>(),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{clientTypeLabel[row.original.client_type]}</span>
    ),
  },
  {
    accessorKey: "sector",
    meta: { label: "Sector" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sector" />,
    cell: ({ row }) => row.original.sector ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: "kyc_status",
    meta: { label: "KYC", exportValue: (r) => kycStatus[r.kyc_status].label },
    filterFn: facetFilter<ReferredClientRow>(),
    header: ({ column }) => <DataTableColumnHeader column={column} title="KYC" />,
    cell: ({ row }) => <StatusBadge status={kycStatus[row.original.kyc_status]} />,
  },
  {
    accessorKey: "created_at",
    meta: { label: "Added" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Added" />,
    cell: ({ row }) => <DateText value={row.original.created_at} />,
  },
];

export function ReferredClientsTable({
  clients,
  referrerName,
}: {
  clients: ReferredClientRow[];
  referrerName: string;
}) {
  return (
    <DataTable
      tableKey="referrer.clients"
      label={`Clients referred by ${referrerName}`}
      columns={columns}
      data={clients}
      getRowId={(c) => c.id}
      searchText={(c) => `${c.display_name} ${c.sector ?? ""}`}
      searchPlaceholder="Search clients…"
      facets={[
        {
          columnId: "kyc_status",
          title: "KYC",
          options: (Object.keys(kycStatus) as (keyof typeof kycStatus)[]).map((k) => ({
            value: k,
            label: kycStatus[k].label,
          })),
        },
      ]}
      rowHref={(c) => `/clients/${c.id}`}
      exportName={`clients-${referrerName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      initialSorting={[{ id: "display_name", desc: false }]}
      emptyState={
        <EmptyState
          icon={<UsersIcon />}
          title="No clients referred yet"
          description="Clients whose enquiry names this referrer will appear here."
        />
      }
    />
  );
}
