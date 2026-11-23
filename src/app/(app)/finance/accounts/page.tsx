import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Chart of accounts" };

export default function FinanceAccountsPage() {
  return (
    <PlaceholderPage
      title="Chart of accounts"
      description="The accounts the books are kept in."
      task="3.1"
      contents="Account tree by type with add and edit; system accounts are locked."
    />
  );
}
