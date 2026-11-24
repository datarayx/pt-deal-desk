import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Button } from "@/components/ui/button";
import { FinancierSheet } from "@/features/financiers/components/financier-sheet";
import { FinanciersTable } from "@/features/financiers/components/financiers-table";
import { getFacilityTypeNames, getFinanciers } from "@/features/financiers/queries";
import { getSavedViews } from "@/features/saved-views/queries";

export const metadata: Metadata = { title: "Financiers" };

async function AddFinancier() {
  const facilityTypeNames = await getFacilityTypeNames();
  return (
    <FinancierSheet
      facilityTypeNames={facilityTypeNames}
      trigger={
        <Button>
          <PlusIcon /> Add financier
        </Button>
      }
    />
  );
}

async function FinanciersSection() {
  const [financiers, facilityTypeNames, savedViews] = await Promise.all([
    getFinanciers(),
    getFacilityTypeNames(),
    getSavedViews("financiers"),
  ]);
  return (
    <FinanciersTable
      financiers={financiers}
      facilityTypeNames={facilityTypeNames}
      savedViews={savedViews}
    />
  );
}

export default function FinanciersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Financiers"
        description="Finance houses and banks P&T places deals with: their monthly rates, what they fund and what they ask for."
        actions={
          <Suspense
            fallback={
              <Button disabled>
                <PlusIcon /> Add financier
              </Button>
            }
          >
            <AddFinancier />
          </Suspense>
        }
      />
      <Suspense fallback={<DataTableSkeleton columns={7} rows={6} />}>
        <FinanciersSection />
      </Suspense>
    </div>
  );
}
