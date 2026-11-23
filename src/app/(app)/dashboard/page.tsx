import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return (
    <PlaceholderPage
      title="Overview"
      description="Your business on one screen."
      task="4.4"
      contents="KPIs, ongoing transactions, repayments due in the next 14 days, overdue list with Log call, pipeline by stage, fees earned vs received and top referrers."
    />
  );
}
