import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Expenses & receipts" };

export default function FinanceTransactionsPage() {
  return (
    <PlaceholderPage
      title="Expenses & receipts"
      description="Quick entry for everyday money in and out."
      task="3.3"
      contents="Quick forms for expenses and receipts that post the correct journals."
    />
  );
}
