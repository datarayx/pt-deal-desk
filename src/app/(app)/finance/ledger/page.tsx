import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "General ledger" };

export default function FinanceLedgerPage() {
  return (
    <PlaceholderPage
      title="General ledger"
      description="Every movement on an account, with a running balance."
      task="3.4"
      contents="Per-account ledger with running balance, period filter and export."
    />
  );
}
