import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { LedgerWorkspace } from "@/features/accounting/components/ledger-workspace";
import { getLedgerPageData } from "@/features/accounting/queries";
import { getSavedViews } from "@/features/saved-views/queries";

export const metadata: Metadata = { title: "General ledger" };

async function LedgerSection() {
  const [rows, savedViews] = await Promise.all([getLedgerPageData(), getSavedViews("ledger")]);
  return <LedgerWorkspace rows={rows} savedViews={savedViews} />;
}

export default function FinanceLedgerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="General ledger"
        description="Every posted movement with a per-account running balance."
      />
      <Suspense fallback={<DataTableSkeleton columns={7} rows={12} />}>
        <LedgerSection />
      </Suspense>
    </div>
  );
}

