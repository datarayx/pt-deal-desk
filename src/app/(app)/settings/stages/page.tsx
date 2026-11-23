import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { SettingsPanel } from "@/features/settings/components/settings-panel";
import { SettingsPanelSkeleton } from "@/features/settings/components/settings-panel-skeleton";
import { StageSheet } from "@/features/settings/components/stage-sheet";
import { StagesList } from "@/features/settings/components/stages-list";
import { getDealStages } from "@/features/settings/queries";

export const metadata: Metadata = { title: "Deal stages · Settings" };

async function StagesSection() {
  const stages = await getDealStages();
  return (
    <SettingsPanel
      title="Deal stages"
      description="The pipeline every deal moves through. Drag to reorder; stages marked Workflow drive disbursement and repayment and can be renamed but not deleted."
      action={
        <StageSheet
          trigger={
            <Button>
              <PlusIcon /> Add stage
            </Button>
          }
        />
      }
      flush
    >
      <StagesList stages={stages} />
    </SettingsPanel>
  );
}

export default function DealStagesPage() {
  return (
    <Suspense fallback={<SettingsPanelSkeleton rows={8} />}>
      <StagesSection />
    </Suspense>
  );
}
