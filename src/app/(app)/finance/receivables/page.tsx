import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { ReceivablesWorkspace } from "@/features/accounting/components/receivables-workspace";
import { getReceivablesPageData } from "@/features/accounting/finance-queries";
import { getSavedViews } from "@/features/saved-views/queries";

export const metadata: Metadata = { title: "Fee receivables" };

async function ReceivablesSection() {
  const [fees, savedViews] = await Promise.all([
    getReceivablesPageData(),
    getSavedViews("fee-receivables"),
  ]);
  return <ReceivablesWorkspace fees={fees} savedViews={savedViews} />;
}

export default function FinanceReceivablesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Fee receivables"
        description="Fees P&T has earned and is waiting to receive."
      />
      <Suspense fallback={<DataTableSkeleton columns={7} rows={8} />}>
        <ReceivablesSection />
      </Suspense>
    </div>
  );
}
