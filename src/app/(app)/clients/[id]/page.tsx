import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Client" };

export default function ClientsIdPage() {
  return (
    <PlaceholderPage
      title="Client"
      description="Everything about one client in one place."
      task="2.5"
      contents="Header with KYC and reliability badges, then tabs: Overview · KYC & Documents · Directors · Credit checks · Deals · Repayments · Activity."
    />
  );
}
