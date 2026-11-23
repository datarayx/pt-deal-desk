import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Follow-ups" };

export default function FollowUpsPage() {
  return (
    <PlaceholderPage
      title="Follow-ups"
      description="Calls to chase overdue repayments."
      task="2.9"
      contents="Call tasks with client, deal, due date, assignee, outcome and promise-to-pay date, plus the call-log form."
    />
  );
}
