import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "New client" };

export default function ClientsNewPage() {
  return (
    <PlaceholderPage
      title="New client"
      description="Add a company or individual and capture their KYC."
      task="2.4"
      contents="Five steps: type → details → directors (companies) → documents → review, with Nigerian validation for phone, BVN, NIN and RC number."
    />
  );
}
