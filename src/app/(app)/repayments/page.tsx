import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { RepaymentsWorkspace } from "@/features/repayments/components/repayments-workspace";
import { getRepaymentsPageData } from "@/features/repayments/queries";
import { getSavedViews } from "@/features/saved-views/queries";

export const metadata: Metadata = { title: "Repayments" };

async function RepaymentsSection() {
  const [data, savedViews] = await Promise.all([
    getRepaymentsPageData(),
    getSavedViews("repayments"),
  ]);
  return <RepaymentsWorkspace data={data} savedViews={savedViews} />;
}

export default function RepaymentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Repayments"
        description="Instalments due, overdue, reported and confirmed."
      />
      <Suspense fallback={<DataTableSkeleton columns={8} rows={6} />}>
        <RepaymentsSection />
      </Suspense>
    </div>
  );
}
