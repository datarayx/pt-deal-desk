import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Deals" };

export default function DealsPage() {
  return (
    <PlaceholderPage
      title="Deals"
      description="Every deal from enquiry to full repayment."
      task="2.6"
      contents="Kanban and table views of the pipeline with stage totals in ₦, days in stage, deficiencies and stale flags, plus the New deal sheet."
    />
  );
}
