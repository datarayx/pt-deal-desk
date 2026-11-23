import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Company profile · Settings" };

export default function SettingsCompanyPage() {
  return (
    <PlaceholderPage
      level="section"
      title="Company profile"
      description="P&T's details for letterheads and emails."
      task="2.1"
      contents="Company name, address, logo and the letterhead used on exported reports."
    />
  );
}
