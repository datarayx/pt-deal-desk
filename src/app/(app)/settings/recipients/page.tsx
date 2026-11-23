import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { RecipientSheet } from "@/features/settings/components/recipient-sheet";
import { RecipientsList } from "@/features/settings/components/recipients-list";
import { SettingsPanel } from "@/features/settings/components/settings-panel";
import { SettingsPanelSkeleton } from "@/features/settings/components/settings-panel-skeleton";
import { getRecipients } from "@/features/settings/queries";

export const metadata: Metadata = { title: "Notification recipients · Settings" };

async function RecipientsSection() {
  const recipients = await getRecipients();
  return (
    <SettingsPanel
      title="Notification recipients"
      description="People who receive alert emails, and which alerts each one gets. Pause someone with the switch without losing their settings."
      action={
        <RecipientSheet
          trigger={
            <Button>
              <PlusIcon /> Add recipient
            </Button>
          }
        />
      }
      flush
    >
      <RecipientsList recipients={recipients} />
    </SettingsPanel>
  );
}

export default function RecipientsPage() {
  return (
    <Suspense fallback={<SettingsPanelSkeleton rows={4} />}>
      <RecipientsSection />
    </Suspense>
  );
}
