import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Payables" };

export default function FinancePayablesPage() {
  return (
    <PlaceholderPage
      title="Payables"
      description="Referral fees and bills P&T owes."
      task="3.3"
      contents="Referral fees and bills payable, with Record payment."
    />
  );
}
