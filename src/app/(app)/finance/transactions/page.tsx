import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { TransactionsWorkspace } from "@/features/accounting/components/transactions-workspace";
import { getAccountsPageData } from "@/features/accounting/queries";

export const metadata: Metadata = { title: "Expenses & receipts" };

async function TransactionsSection() {
  const accounts = await getAccountsPageData();
  return (
    <TransactionsWorkspace
      expenseAccounts={accounts.filter(
        (account) => account.type === "expense" && account.is_active,
      )}
    />
  );
}

export default function FinanceTransactionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Expenses & receipts"
        description="Quick entry for everyday money in and out."
      />
      <Suspense fallback={<DataTableSkeleton columns={4} rows={4} />}>
        <TransactionsSection />
      </Suspense>
    </div>
  );
}
