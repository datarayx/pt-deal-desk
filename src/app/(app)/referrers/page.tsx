import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Referrers" };

export default function ReferrersPage() {
  return (
    <PlaceholderPage
      title="Referrers"
      description="Consultants, firms and past clients who bring in business."
      task="2.3"
      contents="Referrer directory with clients referred, deals funded and referral fees earned and paid."
    />
  );
}
