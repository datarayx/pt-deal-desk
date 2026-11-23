import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Users & roles · Settings" };

export default function SettingsUsersPage() {
  return (
    <PlaceholderPage
      level="section"
      title="Users & roles"
      description="Who can sign in and what they can see."
      task="2.1"
      contents="Invite users, assign CEO or Accountant, deactivate accounts and sign out everywhere."
    />
  );
}
