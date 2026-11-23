import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Repayments" };

export default function RepaymentsPage() {
  return (
    <PlaceholderPage
      title="Repayments"
      description="Instalments due, overdue, reported and confirmed."
      task="2.8"
      contents="Tabs for Due soon · Overdue · Reported · Confirmed, with Record reported payment (with proof), Confirm with financier and Log call."
    />
  );
}
