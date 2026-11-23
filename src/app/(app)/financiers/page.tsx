import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Financiers" };

export default function FinanciersPage() {
  return (
    <PlaceholderPage
      title="Financiers"
      description="Finance houses and banks P&T works with."
      task="2.2"
      contents="Directory with monthly rate range, facility types, collateral policy and each financier's requirement checklist template."
    />
  );
}
