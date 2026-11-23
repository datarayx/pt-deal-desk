import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Reminder timings · Settings" };

export default function SettingsRemindersPage() {
  return (
    <PlaceholderPage
      level="section"
      title="Reminder timings"
      description="When repayment reminders go out."
      task="2.1"
      contents="Days before due (default 7, 3 and 0), overdue escalation days and stale-deal threshold."
    />
  );
}
