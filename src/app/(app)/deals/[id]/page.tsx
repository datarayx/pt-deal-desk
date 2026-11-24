import { ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DateText } from "@/components/common/date-text";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { MoneyText } from "@/components/common/money-text";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealActions } from "@/features/deals/components/deal-actions";
import {
  DealActivity,
  DealDocuments,
  DealFees,
  DealOverview,
  DealRepayments,
  DealRequirements,
} from "@/features/deals/components/deal-detail-sections";
import { getDealDetail } from "@/features/deals/detail-queries";
import { dealOutcome } from "@/lib/status";

export const metadata: Metadata = { title: "Deal" };

async function DealView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getDealDetail(id);
  const nextDue = data.schedules.find((item) => item.status !== "confirmed");
  const deficiencies = data.requirements.filter(
    (item) => item.is_required && item.status === "pending",
  ).length;
  const amount =
    data.deal.amount_disbursed ?? data.deal.amount_approved ?? data.deal.amount_requested;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <Link href="/deals" className="inline-flex items-center gap-1 hover:text-foreground">
            <ChevronLeftIcon className="size-3.5" aria-hidden /> Deals
          </Link>
        }
        title={data.deal.reference}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{data.stage.name}</Badge>
            <StatusBadge status={dealOutcome[data.deal.outcome]} />
          </div>
        }
        description={
          <>
            {data.deal.client_name} · {data.deal.financier_name ?? "No financier"}
            {nextDue ? (
              <>
                {" "}
                · Next due <DateText value={nextDue.due_date} />
              </>
            ) : null}
          </>
        }
        actions={<DealActions data={data} />}
      />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-small text-muted-foreground">
        <MoneyText value={amount} className="text-body font-semibold text-foreground" />
        <span>{data.deal.facility_type ?? "Facility not set"}</span>
        <span>
          Stage entered <DateText value={data.deal.stage_entered_at} />
        </span>
      </div>
      <Tabs defaultValue="overview">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">
            Requirements{" "}
            <span className="num text-muted-foreground">
              {deficiencies > 0 ? `${deficiencies} deficient` : data.requirements.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="repayments">
            Repayments <span className="num text-muted-foreground">{data.schedules.length}</span>
          </TabsTrigger>
          <TabsTrigger value="fees">
            Fees <span className="num text-muted-foreground">{data.fees.length}</span>
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents <span className="num text-muted-foreground">{data.documents.length}</span>
          </TabsTrigger>
          <TabsTrigger value="activity">
            Activity <span className="num text-muted-foreground">{data.activities.length}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-4">
          <DealOverview data={data} />
        </TabsContent>
        <TabsContent value="requirements" className="pt-4">
          <DealRequirements requirements={data.requirements} />
        </TabsContent>
        <TabsContent value="repayments" className="pt-4">
          <DealRepayments schedules={data.schedules} />
        </TabsContent>
        <TabsContent value="fees" className="pt-4">
          <DealFees fees={data.fees} />
        </TabsContent>
        <TabsContent value="documents" className="pt-4">
          <DealDocuments documents={data.documents} />
        </TabsContent>
        <TabsContent value="activity" className="pt-4">
          <DealActivity activities={data.activities} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DealSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading deal">
      <div className="space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-surface-subtle" />
        <div className="h-7 w-72 animate-pulse rounded bg-surface-subtle" />
        <div className="h-4 w-56 animate-pulse rounded bg-surface-subtle" />
      </div>
      <DataTableSkeleton columns={6} rows={6} />
    </div>
  );
}

export default function DealsIdPage({ params }: PageProps<"/deals/[id]">) {
  return (
    <Suspense fallback={<DealSkeleton />}>
      <DealView params={params} />
    </Suspense>
  );
}
