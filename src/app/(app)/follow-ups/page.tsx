import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { FollowUpsWorkspace } from "@/features/follow-ups/components/follow-ups-workspace";
import { getFollowUps } from "@/features/follow-ups/queries";
import { getSavedViews } from "@/features/saved-views/queries";

export const metadata: Metadata = { title: "Follow-ups" };

async function FollowUpsSection() {
  const [tasks, savedViews] = await Promise.all([getFollowUps(), getSavedViews("follow-ups")]);
  return <FollowUpsWorkspace tasks={tasks} savedViews={savedViews} />;
}

export default function FollowUpsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups"
        description="Calls to chase overdue repayments and keep promises to pay visible."
      />
      <Suspense fallback={<DataTableSkeleton columns={7} rows={6} />}>
        <FollowUpsSection />
      </Suspense>
    </div>
  );
}
