import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { ReportsWorkspace } from "@/features/reports/components/reports-workspace";
import { getReportsPageData } from "@/features/reports/queries";

export const metadata: Metadata = { title: "Reports" };

async function ReportsSection() {
  const data = await getReportsPageData();
  return <ReportsWorkspace data={data} />;
}

export default function FinanceReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Reports"
        description="Financial statements for any period."
      />
      <Suspense fallback={<DataTableSkeleton columns={4} rows={10} />}>
        <ReportsSection />
      </Suspense>
    </div>
  );
}
