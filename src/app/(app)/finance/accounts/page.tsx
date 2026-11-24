import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { AccountsWorkspace } from "@/features/accounting/components/accounts-workspace";
import { getAccountsPageData } from "@/features/accounting/queries";
import { getSavedViews } from "@/features/saved-views/queries";

export const metadata: Metadata = { title: "Chart of accounts" };

async function AccountsSection() {
  const [accounts, savedViews] = await Promise.all([
    getAccountsPageData(),
    getSavedViews("accounts"),
  ]);
  return <AccountsWorkspace accounts={accounts} savedViews={savedViews} />;
}

export default function FinanceAccountsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Chart of accounts"
        description="The accounts the books are kept in."
      />
      <Suspense fallback={<DataTableSkeleton columns={7} rows={10} />}>
        <AccountsSection />
      </Suspense>
    </div>
  );
}
