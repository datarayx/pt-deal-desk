import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Finance overview" };

export default function FinancePage() {
  return (
    <PlaceholderPage
      title="Finance overview"
      description="Cash, receivables, payables and this month's results."
      task="4.4"
      contents="Cash and bank balance, fee receivables, payables, this month's income and expenses, and a profit-or-loss snapshot."
    />
  );
}
