import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Period close" };

export default function FinancePeriodsPage() {
  return (
    <PlaceholderPage
      title="Period close"
      description="Lock months once their books are final."
      task="3.1"
      contents="Month list with lock and unlock; posting to a locked period is blocked."
    />
  );
}
