"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BriefcaseIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { MoneyText } from "@/components/common/money-text";
import { StatusBadge } from "@/components/common/status-badge";
import { facetFilter } from "@/components/data-table/column-meta";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { dealColumns, outcomeFacetOptions } from "@/features/deals/deal-columns";
import { FeeTerms, feeTermsText } from "@/features/referrers/components/fee-terms";
import type { ReferrerDealRow } from "@/features/referrers/queries";
import { feeStatus } from "@/lib/status";

type FeeState = keyof typeof feeStatus | "none";
const feeState = (r: ReferrerDealRow): FeeState => r.referral_fee?.status ?? "none";

const columns: ColumnDef<ReferrerDealRow>[] = [
  ...dealColumns<ReferrerDealRow>({ hide: ["facility"] }).slice(0, 2),
  {
    accessorKey: "financier_name",
    meta: { label: "Financier", className: "max-w-40 truncate" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Financier" />,
    cell: ({ row }) =>
      row.original.financier_name ?? <span className="text-muted-foreground">—</span>,
  },
  ...dealColumns<ReferrerDealRow>({ hide: ["facility"] }).slice(2),
  {
    id: "fee_terms",
    accessorFn: (r) => r.referral_fee?.value ?? null,
    enableSorting: false,
    meta: {
      label: "Agreed fee",
      align: "right",
      exportValue: (r) =>
        r.referral_fee ? feeTermsText(r.referral_fee.basis, r.referral_fee.value) : "",
    },
    header: () => <span className="block text-right">Agreed fee</span>,
    cell: ({ row }) => (
      <FeeTerms
        basis={row.original.referral_fee?.basis ?? null}
        value={row.original.referral_fee?.value ?? null}
      />
    ),
  },
  {
    id: "fee_amount",
    accessorFn: (r) =>
      r.referral_fee?.computed_amount ? Number(r.referral_fee.computed_amount) : null,
    sortUndefined: "last",
    meta: {
      label: "Referral fee",
      align: "right",
      exportValue: (r) => r.referral_fee?.computed_amount ?? "",
    },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Referral fee" />,
    cell: ({ row }) => {
      const fee = row.original.referral_fee;
      if (!fee) return <span className="text-muted-foreground">—</span>;
      if (!fee.computed_amount) {
        return <span className="text-small text-muted-foreground">Not yet earned</span>;
      }
      return <MoneyText value={fee.computed_amount} />;
    },
  },
  {
    id: "fee_status",
    accessorFn: feeState,
    filterFn: facetFilter<ReferrerDealRow>(),
    meta: {
      label: "Fee status",
      exportValue: (r) => (r.referral_fee ? feeStatus[r.referral_fee.status].label : "No fee"),
    },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fee status" />,
    cell: ({ row }) => {
      const fee = row.original.referral_fee;
      if (!fee) return <span className="text-muted-foreground">No fee</span>;
      // "Earned" for a referral fee means P&T owes it: show it as payable.
      return fee.status === "earned" ? (
        <StatusBadge tone="warning" label="Payable" />
      ) : (
        <StatusBadge status={feeStatus[fee.status]} />
      );
    },
  },
];

const feeOptions = [
  { value: "pending", label: "Pending" },
  { value: "earned", label: "Payable" },
  { value: "paid", label: "Paid" },
  { value: "none", label: "No fee" },
];

export function ReferrerDealsTable({
  deals,
  referrerName,
}: {
  deals: ReferrerDealRow[];
  referrerName: string;
}) {
  return (
    <DataTable
      tableKey="referrer.deals"
      label={`Deals referred by ${referrerName}`}
      columns={columns}
      data={deals}
      getRowId={(d) => d.id}
      searchText={(d) => `${d.reference} ${d.client_name} ${d.financier_name ?? ""}`}
      searchPlaceholder="Search deals…"
      facets={[
        { columnId: "outcome", title: "Outcome", options: outcomeFacetOptions },
        { columnId: "fee_status", title: "Fee status", options: feeOptions },
      ]}
      rowHref={(d) => `/deals/${d.id}`}
      exportName={`referrals-${referrerName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      initialSorting={[{ id: "reference", desc: true }]}
      initialHidden={["disbursement_date", "fee_terms"]}
      emptyState={
        <EmptyState
          icon={<BriefcaseIcon />}
          title="No deals referred yet"
          description="Deals that name this referrer will appear here with their referral fee."
        />
      }
    />
  );
}
