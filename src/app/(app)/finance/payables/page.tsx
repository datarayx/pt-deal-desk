import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { PayablesWorkspace } from "@/features/accounting/components/payables-workspace";
import { getPayablesPageData } from "@/features/accounting/finance-queries";
import { getSavedViews } from "@/features/saved-views/queries";

export const metadata: Metadata = { title: "Payables" };

async function PayablesSection() {
  const [fees, savedViews] = await Promise.all([getPayablesPageData(), getSavedViews("payables")]);
  return <PayablesWorkspace fees={fees} savedViews={savedViews} />;
}

export default function FinancePayablesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Payables"
        description="Referral fees and bills P&T owes."
      />
      <Suspense fallback={<DataTableSkeleton columns={6} rows={8} />}>
        <PayablesSection />
      </Suspense>
    </div>
  );
}
