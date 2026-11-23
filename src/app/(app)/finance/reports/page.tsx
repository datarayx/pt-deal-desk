import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Reports" };

export default function FinanceReportsPage() {
  return (
    <PlaceholderPage
      title="Reports"
      description="Financial statements for any period."
      task="3.4"
      contents="Trial balance, profit or loss, financial position and cash flows, with month/quarter/year/custom periods, prior-period comparison and Excel/PDF export."
    />
  );
}
