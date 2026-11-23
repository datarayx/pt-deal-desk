import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage() {
  return (
    <PlaceholderPage
      title="Clients"
      description="Companies and individuals P&T is helping to raise funds."
      task="2.4"
      contents="Client table with name, type, sector, KYC status, latest credit rating, active deals, outstanding balance and referrer — with search, filters and export."
    />
  );
}
