import type { Metadata } from "next";
import { Suspense } from "react";

import { KycChecklists } from "@/features/settings/components/kyc-checklists";
import { SettingsPanel } from "@/features/settings/components/settings-panel";
import { SettingsPanelSkeleton } from "@/features/settings/components/settings-panel-skeleton";
import { getKycDocTypes } from "@/features/settings/queries";

export const metadata: Metadata = { title: "KYC checklists · Settings" };

async function KycSection() {
  const docTypes = await getKycDocTypes();
  return (
    <SettingsPanel
      title="KYC checklists"
      description="Documents P&T collects from each type of client. Demo defaults follow Nigerian KYC/CIS practice; replace them with P&T's own forms when ready."
      flush
    >
      <KycChecklists docTypes={docTypes} />
    </SettingsPanel>
  );
}

export default function KycChecklistsPage() {
  return (
    <Suspense fallback={<SettingsPanelSkeleton rows={9} />}>
      <KycSection />
    </Suspense>
  );
}
