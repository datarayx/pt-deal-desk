import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { DashboardWorkspace } from "@/features/dashboard/components/dashboard-workspace";
import { getDashboardData } from "@/features/dashboard/queries";

export const metadata: Metadata = { title: "Overview" };

async function DashboardSection() {
  const data = await getDashboardData();
  return <DashboardWorkspace data={data} />;
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Your business on one screen." />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardSection />
      </Suspense>
    </div>
  );
}
