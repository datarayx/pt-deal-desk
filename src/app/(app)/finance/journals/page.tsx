import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { JournalsWorkspace } from "@/features/accounting/components/journals-workspace";
import { getAccountsPageData, getJournalsPageData } from "@/features/accounting/queries";
import { getSavedViews } from "@/features/saved-views/queries";

export const metadata: Metadata = { title: "Journals" };

async function JournalsSection() {
  const [journals, accounts, savedViews] = await Promise.all([
    getJournalsPageData(),
    getAccountsPageData(),
    getSavedViews("journals"),
  ]);
  return <JournalsWorkspace journals={journals} accounts={accounts} savedViews={savedViews} />;
}

export default function FinanceJournalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Journals"
        description="Every journal entry in the books."
      />
      <Suspense fallback={<DataTableSkeleton columns={7} rows={8} />}>
        <JournalsSection />
      </Suspense>
    </div>
  );
}
