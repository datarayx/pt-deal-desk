import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Journals" };

export default function FinanceJournalsPage() {
  return (
    <PlaceholderPage
      title="Journals"
      description="Every journal entry in the books."
      task="3.1"
      contents="Journal list and the manual journal form, which refuses unbalanced entries and locked periods."
    />
  );
}
