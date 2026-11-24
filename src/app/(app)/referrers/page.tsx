import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Button } from "@/components/ui/button";
import { ReferrerSheet } from "@/features/referrers/components/referrer-sheet";
import { ReferrersTable } from "@/features/referrers/components/referrers-table";
import { getReferrers } from "@/features/referrers/queries";
import { getSavedViews } from "@/features/saved-views/queries";

export const metadata: Metadata = { title: "Referrers" };

async function ReferrersSection() {
  const [referrers, savedViews] = await Promise.all([getReferrers(), getSavedViews("referrers")]);
  return <ReferrersTable referrers={referrers} savedViews={savedViews} />;
}

export default function ReferrersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Referrers"
        description="People and firms who introduce clients, the deals that came from them and the referral fees P&T owes."
        actions={
          <ReferrerSheet
            trigger={
              <Button>
                <PlusIcon /> Add referrer
              </Button>
            }
          />
        }
      />
      <Suspense fallback={<DataTableSkeleton columns={8} rows={5} />}>
        <ReferrersSection />
      </Suspense>
    </div>
  );
}
