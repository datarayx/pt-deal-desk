import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Notification recipients · Settings" };

export default function SettingsRecipientsPage() {
  return (
    <PlaceholderPage
      level="section"
      title="Notification recipients"
      description="Staff who get reminder emails but don't sign in."
      task="2.1"
      contents="Name, title, email and which alerts each recipient receives (due soon, due today, overdue, stale deals)."
    />
  );
}
