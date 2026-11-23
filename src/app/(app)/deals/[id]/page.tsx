import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Deal" };

export default function DealsIdPage() {
  return (
    <PlaceholderPage
      title="Deal"
      description="One deal, its requirements, money and history."
      task="2.7"
      contents="Header with amount, stage, financier and next due date, tabs for Overview · Requirements · Repayments · Fees · Documents · Activity, and the Move stage, Decline and Disburse actions."
    />
  );
}
