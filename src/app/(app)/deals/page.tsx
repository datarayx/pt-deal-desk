import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Suspense } from "react";
import { DealsWorkspace } from "@/features/deals/components/deals-workspace";
import { NewDealSheet } from "@/features/deals/components/new-deal-sheet";
import { getDealsPageData } from "@/features/deals/queries";

export const metadata: Metadata = { title: "Deals" };

async function DealsSection() {
  const data = await getDealsPageData();
  return (
    <>
      <PageHeader
        title="Deals"
        description="Every deal from enquiry to full repayment, with stage history and financier requirements kept together."
        actions={<NewDealSheet options={data.options} />}
      />
      <DealsWorkspace {...data} />
    </>
  );
}

export default function DealsPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<DataTableSkeleton columns={8} rows={6} />}>
        <DealsSection />
      </Suspense>
    </div>
  );
}
