"use client";

import { BriefcaseIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { DataTable } from "@/components/data-table/data-table";
import { dealColumns, outcomeFacetOptions } from "@/features/deals/deal-columns";
import type { FinancierDealRow } from "@/features/financiers/queries";

const columns = dealColumns<FinancierDealRow>();

export function FinancierDealsTable({
  deals,
  financierName,
}: {
  deals: FinancierDealRow[];
  financierName: string;
}) {
  const stages = [...new Set(deals.map((d) => d.stage_name))].map((s) => ({ value: s, label: s }));
  return (
    <DataTable
      tableKey="financier.deals"
      label={`Deals with ${financierName}`}
      columns={columns}
      data={deals}
      getRowId={(d) => d.id}
      searchText={(d) => `${d.reference} ${d.client_name} ${d.facility_type ?? ""}`}
      searchPlaceholder="Search deals…"
      facets={[
        { columnId: "stage_name", title: "Stage", options: stages },
        { columnId: "outcome", title: "Outcome", options: outcomeFacetOptions },
      ]}
      rowHref={(d) => `/deals/${d.id}`}
      exportName={`deals-${financierName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      initialSorting={[{ id: "reference", desc: true }]}
      emptyState={
        <EmptyState
          icon={<BriefcaseIcon />}
          title="No deals with this financier yet"
          description="Deals placed with them will appear here."
        />
      }
    />
  );
}
