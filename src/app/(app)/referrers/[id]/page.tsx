import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Referrer" };

export default function ReferrersIdPage() {
  return (
    <PlaceholderPage
      title="Referrer"
      description="One referrer and the business they brought in."
      task="2.3"
      contents="Contact details, referred clients and deals, and referral fees payable and paid."
    />
  );
}
