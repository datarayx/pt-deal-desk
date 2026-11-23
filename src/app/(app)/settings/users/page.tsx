import type { Metadata } from "next";
import { Suspense } from "react";

import { InviteUserSheet } from "@/features/settings/components/invite-user-sheet";
import { SettingsPanel } from "@/features/settings/components/settings-panel";
import { SettingsPanelSkeleton } from "@/features/settings/components/settings-panel-skeleton";
import { UsersList } from "@/features/settings/components/users-list";
import { getUsers } from "@/features/settings/queries";

export const metadata: Metadata = { title: "Users & roles · Settings" };

async function UsersSection() {
  const { users, currentUserId } = await getUsers();
  return (
    <SettingsPanel
      title="Users & roles"
      description="Who can sign in to Deal Desk and what they can see. CEOs manage everything; accountants work on the books and reports."
      action={<InviteUserSheet />}
      flush
    >
      <UsersList users={users} currentUserId={currentUserId} />
    </SettingsPanel>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<SettingsPanelSkeleton rows={2} />}>
      <UsersSection />
    </Suspense>
  );
}
