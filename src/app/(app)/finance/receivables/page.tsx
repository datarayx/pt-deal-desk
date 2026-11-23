import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Fee receivables" };

export default function FinanceReceivablesPage() {
  return (
    <PlaceholderPage
      title="Fee receivables"
      description="Fees P&T has earned and is waiting to receive."
      task="3.3"
      contents="Fee lines by source (commission, client fee, collateral fee) with deal reference, amount, earned date and status, and Record receipt."
    />
  );
}
