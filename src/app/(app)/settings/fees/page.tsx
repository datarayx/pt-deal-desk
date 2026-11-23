import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Fee defaults · Settings" };

export default function SettingsFeesPage() {
  return (
    <PlaceholderPage
      level="section"
      title="Fee defaults"
      description="Default fees, VAT and withholding tax."
      task="2.1"
      contents="Default provider commission, client and collateral fees, referral fee basis, VAT and WHT rates."
    />
  );
}
