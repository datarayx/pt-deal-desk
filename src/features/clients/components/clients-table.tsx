"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2Icon, PlusIcon, UserIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

import { DateText } from "@/components/common/date-text";
import { EmptyState } from "@/components/common/empty-state";
import { MoneyText } from "@/components/common/money-text";
import { StatusBadge } from "@/components/common/status-badge";
import { facetFilter, type FacetDef } from "@/components/data-table/column-meta";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { selectColumn } from "@/components/data-table/select-column";
import { Button } from "@/components/ui/button";
import {
  CLIENT_TYPES,
  clientTypeLabel,
  ENQUIRY_SOURCES,
  enquirySourceLabel,
} from "@/features/clients/options";
import type { ClientListRow } from "@/features/clients/queries";
import type { SavedView } from "@/features/saved-views/schemas";
import { formatDate } from "@/lib/format/date";
import { kycStatus, reliability } from "@/lib/status";
import { cn } from "@/lib/utils";

type Row = ClientListRow;
const dash = <span className="text-muted-foreground">—</span>;

const columns: ColumnDef<Row>[] = [
  selectColumn<Row>(),
  {
    accessorKey: "display_name",
    meta: { label: "Client" },
    enableHiding: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }) => {
      const Icon = row.original.client_type === "company" ? Building2Icon : UserIcon;
      return (
        <span className="inline-flex max-w-56 items-center gap-2">
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <Link
            href={`/clients/${row.original.id}`}
            className="truncate font-medium text-foreground hover:text-accent-ink hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {row.original.display_name}
          </Link>
        </span>
      );
    },
  },
  {
    accessorKey: "client_type",
    meta: { label: "Type", exportValue: (r) => clientTypeLabel[r.client_type] },
    filterFn: facetFilter<Row>(),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{clientTypeLabel[row.original.client_type]}</span>
    ),
  },
  {
    id: "sector",
    accessorFn: (r) => r.sector ?? "Not set",
    meta: { label: "Sector", exportValue: (r) => r.sector ?? "", className: "max-w-36 truncate" },
    filterFn: facetFilter<Row>(),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sector" />,
    cell: ({ row }) => row.original.sector ?? dash,
  },
  {
    accessorKey: "kyc_status",
    meta: { label: "KYC", exportValue: (r) => kycStatus[r.kyc_status].label },
    filterFn: facetFilter<Row>(),
    header: ({ column }) => <DataTableColumnHeader column={column} title="KYC" />,
    cell: ({ row }) => <StatusBadge status={kycStatus[row.original.kyc_status]} />,
  },
  {
    accessorKey: "reliability_badge",
    meta: { label: "Reliability", exportValue: (r) => reliability[r.reliability_badge].label },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reliability" />,
    cell: ({ row }) => <StatusBadge status={reliability[row.original.reliability_badge]} />,
  },
  {
    id: "documents",
    accessorFn: (r) => (r.required_docs === 0 ? 1 : r.received_docs / r.required_docs),
    meta: {
      label: "Required documents",
      exportValue: (r) => `${r.received_docs}/${r.required_docs}`,
    },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Documents" />,
    cell: ({ row }) => {
      const { received_docs: got, required_docs: need } = row.original;
      const pct = need === 0 ? 100 : Math.round((got / need) * 100);
      return (
        <span
          className="inline-flex items-center gap-2"
          title={`${got} of ${need} required documents received`}
        >
          <span className="h-1.5 w-10 overflow-hidden rounded-full bg-surface-subtle" aria-hidden>
            <span
              className={cn("block h-full rounded-full", pct === 100 ? "bg-success" : "bg-warning")}
              style={{ width: `${pct}%` }}
            />
          </span>
          <span className="num text-small text-muted-foreground">
            {got}/{need}
          </span>
        </span>
      );
    },
  },
  {
    accessorKey: "latest_rating",
    sortUndefined: "last",
    meta: {
      label: "Latest credit rating",
      exportValue: (r) =>
        r.latest_rating ? `${r.latest_rating} (${r.latest_bureau}, ${r.latest_check_date})` : "",
    },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Credit rating" />,
    cell: ({ row }) =>
      row.original.latest_rating ? (
        <span
          className="inline-flex items-baseline gap-1.5"
          title={`${row.original.latest_bureau}, checked ${formatDate(row.original.latest_check_date ?? "") ?? ""}`}
        >
          <span className="font-medium">{row.original.latest_rating}</span>
          <span className="text-caption text-muted-foreground">{row.original.latest_bureau}</span>
        </span>
      ) : (
        <span className="text-small text-muted-foreground">No check yet</span>
      ),
  },
  {
    accessorKey: "active_deals",
    meta: { label: "Active deals", align: "right" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Active deals" />,
    cell: ({ row }) => <span className="num">{row.original.active_deals}</span>,
  },
  {
    id: "outstanding",
    accessorFn: (r) => Number(r.outstanding),
    meta: { label: "Outstanding", align: "right", exportValue: (r) => r.outstanding },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Outstanding" />,
    cell: ({ row }) =>
      Number(row.original.outstanding) === 0 ? (
        dash
      ) : (
        <MoneyText value={row.original.outstanding} />
      ),
  },
  {
    id: "referrer",
    accessorFn: (r) => r.referrer_name ?? "",
    meta: { label: "Referrer", className: "max-w-36 truncate" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Referrer" />,
    cell: ({ row }) =>
      row.original.referrer_id ? (
        <Link
          href={`/referrers/${row.original.referrer_id}`}
          className="hover:text-accent-ink hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {row.original.referrer_name}
        </Link>
      ) : (
        dash
      ),
  },
  {
    accessorKey: "enquiry_source",
    meta: { label: "Source", exportValue: (r) => enquirySourceLabel[r.enquiry_source] },
    filterFn: facetFilter<Row>(),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {enquirySourceLabel[row.original.enquiry_source]}
      </span>
    ),
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
    cell: ({ row }) => row.original.email ?? dash,
  },
  {
    accessorKey: "rc_number",
    meta: { label: "CAC number" },
    enableSorting: false,
    header: "CAC number",
    cell: ({ row }) => <span className="num">{row.original.rc_number ?? "—"}</span>,
  },
  {
    // Masked in the database view; the full number is only ever shown on the client's profile.
    accessorKey: "bvn_masked",
    meta: { label: "BVN" },
    enableSorting: false,
    header: "BVN",
    cell: ({ row }) => <span className="num tracking-wider">{row.original.bvn_masked ?? "—"}</span>,
  },
  {
    accessorKey: "nin_masked",
    meta: { label: "NIN" },
    enableSorting: false,
    header: "NIN",
    cell: ({ row }) => <span className="num tracking-wider">{row.original.nin_masked ?? "—"}</span>,
  },
  {
    accessorKey: "created_at",
    meta: { label: "Added" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Added" />,
    cell: ({ row }) => <DateText value={row.original.created_at} />,
  },
];

export function ClientsTable({ clients, savedViews }: { clients: Row[]; savedViews: SavedView[] }) {
  const sectors = [...new Set(clients.map((c) => c.sector ?? "Not set"))].sort();
  const facets: FacetDef[] = [
    {
      columnId: "client_type",
      title: "Type",
      options: CLIENT_TYPES.map((t) => ({ value: t, label: clientTypeLabel[t] })),
    },
    { columnId: "sector", title: "Sector", options: sectors.map((s) => ({ value: s, label: s })) },
    {
      columnId: "kyc_status",
      title: "KYC status",
      options: (Object.keys(kycStatus) as (keyof typeof kycStatus)[]).map((k) => ({
        value: k,
        label: kycStatus[k].label,
      })),
    },
    {
      columnId: "enquiry_source",
      title: "Source",
      options: ENQUIRY_SOURCES.map((s) => ({ value: s, label: enquirySourceLabel[s] })),
    },
  ];

  return (
    <DataTable
      tableKey="clients"
      label="Clients"
      columns={columns}
      data={clients}
      getRowId={(c) => c.id}
      searchText={(c) =>
        [
          c.display_name,
          c.sector,
          c.phone,
          c.email,
          c.rc_number,
          c.referrer_name,
          c.bvn_masked?.slice(-4),
          c.nin_masked?.slice(-4),
        ].join(" ")
      }
      searchPlaceholder="Search name, phone, CAC number…"
      facets={facets}
      savedViews={savedViews}
      rowHref={(c) => `/clients/${c.id}`}
      exportName="clients"
      initialSorting={[{ id: "display_name", desc: false }]}
      initialHidden={[
        "client_type",
        "enquiry_source",
        "phone",
        "email",
        "rc_number",
        "bvn_masked",
        "nin_masked",
        "created_at",
      ]}
      emptyState={
        <EmptyState
          icon={<UsersIcon />}
          title="No clients yet"
          description="Add the companies and individuals P&T is raising finance for, with their KYC."
          action={
            <Button asChild>
              <Link href="/clients/new">
                <PlusIcon /> New client
              </Link>
            </Button>
          }
        />
      }
    />
  );
}
