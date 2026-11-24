import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { FinanceDashboardSkeleton } from "@/features/finance-dashboard/components/finance-dashboard-skeleton";
import { FinanceDashboardWorkspace } from "@/features/finance-dashboard/components/finance-dashboard-workspace";
import { getFinanceDashboardData } from "@/features/finance-dashboard/queries";

export const metadata: Metadata = { title: "Finance overview" };

async function FinanceSection() {
  const data = await getFinanceDashboardData();
  return <FinanceDashboardWorkspace data={data} />;
}

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Finance overview"
        description="Cash, receivables, payables and this month's results."
      />
      <Suspense fallback={<FinanceDashboardSkeleton />}>
        <FinanceSection />
      </Suspense>
    </div>
  );
}
