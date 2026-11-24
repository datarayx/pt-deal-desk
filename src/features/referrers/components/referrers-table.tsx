"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { HandshakeIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { MoneyText } from "@/components/common/money-text";
import { facetFilter, type FacetDef } from "@/components/data-table/column-meta";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { selectColumn } from "@/components/data-table/select-column";
import { Button } from "@/components/ui/button";
import { FeeTerms, feeTermsText } from "@/features/referrers/components/fee-terms";
import { ReferrerSheet } from "@/features/referrers/components/referrer-sheet";
import type { ReferrerListRow } from "@/features/referrers/queries";
import { REFERRER_TYPES, referrerTypeLabel } from "@/features/referrers/schemas";
import type { SavedView } from "@/features/saved-views/schemas";

const count = (
  key: "clients_referred" | "deal_count" | "deals_funded",
  title: string,
): ColumnDef<ReferrerListRow> => ({
  accessorKey: key,
  meta: { label: title, align: "right" },
  header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
  cell: ({ row }) => <span className="num">{row.original[key]}</span>,
});

const money = (
  key: "amount_funded" | "fees_earned" | "fees_paid" | "fees_payable",
  title: string,
): ColumnDef<ReferrerListRow> => ({
  id: key,
  // Sort on the number; display and export use the exact decimal string.
  accessorFn: (r) => Number(r[key]),
  meta: { label: title, align: "right", exportValue: (r) => r[key] },
  header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
  cell: ({ row }) => <MoneyText value={row.original[key]} />,
});

const columns: ColumnDef<ReferrerListRow>[] = [
  selectColumn<ReferrerListRow>(),
  {
    accessorKey: "name",
    meta: { label: "Name" },
    enableHiding: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <Link
        href={`/referrers/${row.original.id}`}
        className="font-medium text-foreground hover:text-accent-ink hover:underline focus-visible:underline focus-visible:outline-none"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "referrer_type",
    meta: { label: "Type", exportValue: (r) => referrerTypeLabel[r.referrer_type] },
    filterFn: facetFilter<ReferrerListRow>(),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{referrerTypeLabel[row.original.referrer_type]}</span>
    ),
  },
  {
    id: "usual_fee",
    accessorFn: (r) => feeTermsText(r.default_fee_type, r.default_fee_value),
    enableSorting: false,
    meta: { label: "Usual fee", align: "right" },
    header: () => <span className="block text-right">Usual fee</span>,
    cell: ({ row }) => (
      <FeeTerms basis={row.original.default_fee_type} value={row.original.default_fee_value} />
    ),
  },
  count("clients_referred", "Clients"),
  count("deal_count", "Deals"),
  count("deals_funded", "Funded"),
  money("amount_funded", "Amount funded"),
  money("fees_earned", "Fees earned"),
  money("fees_paid", "Paid"),
  money("fees_payable", "Payable"),
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

const facets: FacetDef[] = [
  {
    columnId: "referrer_type",
    title: "Type",
    options: REFERRER_TYPES.map((t) => ({ value: t, label: referrerTypeLabel[t] })),
  },
];

export function ReferrersTable({
  referrers,
  savedViews,
}: {
  referrers: ReferrerListRow[];
  savedViews: SavedView[];
}) {
  return (
    <DataTable
      tableKey="referrers"
      label="Referrers"
      columns={columns}
      data={referrers}
      getRowId={(r) => r.id}
      searchText={(r) => [r.name, r.contact_person, r.email, r.phone].join(" ")}
      searchPlaceholder="Search referrers…"
      facets={facets}
      savedViews={savedViews}
      rowHref={(r) => `/referrers/${r.id}`}
      exportName="referrers"
      initialSorting={[{ id: "fees_earned", desc: true }]}
      initialHidden={["amount_funded", "contact_person", "phone", "email"]}
      emptyState={
        <EmptyState
          icon={<HandshakeIcon />}
          title="No referrers yet"
          description="Add the consultants, firms and past clients who introduce business to P&T."
          action={
            <ReferrerSheet
              trigger={
                <Button>
                  <PlusIcon /> Add referrer
                </Button>
              }
            />
          }
        />
      }
    />
  );
}
