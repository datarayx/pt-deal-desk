import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "KYC checklists · Settings" };

export default function SettingsKycChecklistsPage() {
  return (
    <PlaceholderPage
      level="section"
      title="KYC checklists"
      description="Documents required from each type of client."
      task="2.1"
      contents="Required documents per client type, with expiry tracking where relevant."
    />
  );
}
