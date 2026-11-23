import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Financier" };

export default function FinanciersIdPage() {
  return (
    <PlaceholderPage
      title="Financier"
      description="One financier, their terms and deals."
      task="2.2"
      contents="Contacts, rate range per month, facility types, requirement checklist template and every deal placed with them."
    />
  );
}
