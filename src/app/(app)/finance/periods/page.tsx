import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { PeriodsWorkspace } from "@/features/accounting/components/periods-workspace";
import { getPeriodsPageData } from "@/features/accounting/queries";
import { getSavedViews } from "@/features/saved-views/queries";

export const metadata: Metadata = { title: "Period close" };

async function PeriodsSection() {
  const [periods, savedViews] = await Promise.all([getPeriodsPageData(), getSavedViews("periods")]);
  return <PeriodsWorkspace periods={periods} savedViews={savedViews} />;
}

export default function FinancePeriodsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Period close"
        description="Lock months once their books are final."
      />
      <Suspense fallback={<DataTableSkeleton columns={5} rows={10} />}>
        <PeriodsSection />
      </Suspense>
    </div>
  );
}
