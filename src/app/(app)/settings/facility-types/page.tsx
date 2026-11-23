import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { FacilityTypeSheet } from "@/features/settings/components/facility-type-sheet";
import { FacilityTypesList } from "@/features/settings/components/facility-types-list";
import { SettingsPanel } from "@/features/settings/components/settings-panel";
import { SettingsPanelSkeleton } from "@/features/settings/components/settings-panel-skeleton";
import { getFacilityTypes } from "@/features/settings/queries";

export const metadata: Metadata = { title: "Facility types · Settings" };

async function FacilityTypesSection() {
  const facilityTypes = await getFacilityTypes();
  return (
    <SettingsPanel
      title="Facility types"
      description="The kinds of funding P&T arranges. Types already used by deals can be renamed but not deleted."
      action={
        <FacilityTypeSheet
          trigger={
            <Button>
              <PlusIcon /> Add facility type
            </Button>
          }
        />
      }
      flush
    >
      <FacilityTypesList facilityTypes={facilityTypes} />
    </SettingsPanel>
  );
}

export default function FacilityTypesPage() {
  return (
    <Suspense fallback={<SettingsPanelSkeleton rows={6} />}>
      <FacilityTypesSection />
    </Suspense>
  );
}
