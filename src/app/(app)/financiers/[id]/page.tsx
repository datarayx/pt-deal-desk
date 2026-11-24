import { ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DetailList } from "@/components/common/detail-list";
import { KpiCard } from "@/components/common/kpi-card";
import { MoneyText } from "@/components/common/money-text";
import { PageHeader } from "@/components/common/page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancierActions } from "@/features/financiers/components/financier-actions";
import { FinancierDealsTable } from "@/features/financiers/components/financier-deals-table";
import { RequirementsChecklist } from "@/features/financiers/components/requirements-checklist";
import { getFacilityTypeNames, getFinancier } from "@/features/financiers/queries";
import { financierTypeLabel } from "@/features/financiers/schemas";
import { formatRateRange } from "@/lib/format/rate";

export const metadata: Metadata = { title: "Financier" };

const muted = (text: string) => <span className="text-muted-foreground">{text}</span>;

async function FinancierView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ financier, requirements, deals }, facilityTypeNames] = await Promise.all([
    getFinancier(id),
    getFacilityTypeNames(),
  ]);
  const rates = formatRateRange(financier.rate_min_monthly, financier.rate_max_monthly);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <Link href="/financiers" className="inline-flex items-center gap-1 hover:text-foreground">
            <ChevronLeftIcon className="size-3.5" aria-hidden /> Financiers
          </Link>
        }
        title={financier.name}
        meta={<Badge variant="outline">{financierTypeLabel[financier.financier_type]}</Badge>}
        description={rates ? <span className="num">{rates}</span> : "Rates not recorded"}
        actions={<FinancierActions financier={financier} facilityTypeNames={facilityTypeNames} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          variant="hero"
          label="Total disbursed"
          value={<MoneyText value={financier.total_disbursed} compact />}
          sub={`${financier.funded_count} funded ${financier.funded_count === 1 ? "deal" : "deals"}`}
        />
        <KpiCard
          label="Deals"
          value={<span className="num">{financier.deal_count}</span>}
          sub="All time, including declined"
        />
        <KpiCard
          label="In pipeline"
          value={<span className="num">{financier.pipeline_count}</span>}
          sub="Open and not yet disbursed"
        />
        <KpiCard
          label="Checklist items"
          value={<span className="num">{financier.requirement_count}</span>}
          sub={`${requirements.filter((r) => r.is_required).length} required`}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">
            Requirements <span className="num text-muted-foreground">{requirements.length}</span>
          </TabsTrigger>
          <TabsTrigger value="deals">
            Deals <span className="num text-muted-foreground">{deals.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <DetailList
              rows={[
                { label: "Type", value: financierTypeLabel[financier.financier_type] },
                {
                  label: "Interest rate",
                  value: rates ? <span className="num">{rates}</span> : muted("Not recorded"),
                },
                {
                  label: "Facility types",
                  value:
                    financier.facility_types.length > 0 ? (
                      <span className="flex flex-wrap gap-1.5">
                        {financier.facility_types.map((t) => (
                          <Badge key={t} variant="outline">
                            {t}
                          </Badge>
                        ))}
                      </span>
                    ) : (
                      muted("None recorded")
                    ),
                },
                {
                  label: "Collateral policy",
                  value: financier.collateral_policy ? (
                    <span className="whitespace-pre-line">{financier.collateral_policy}</span>
                  ) : (
                    muted("Not recorded")
                  ),
                },
                {
                  label: "Contact person",
                  value: financier.contact_person ?? muted("Not recorded"),
                },
                {
                  label: "Phone",
                  value: financier.phone ? (
                    <a
                      href={`tel:${financier.phone}`}
                      className="num hover:text-accent-ink hover:underline"
                    >
                      {financier.phone}
                    </a>
                  ) : (
                    muted("Not recorded")
                  ),
                },
                {
                  label: "Email",
                  value: financier.email ? (
                    <a
                      href={`mailto:${financier.email}`}
                      className="hover:text-accent-ink hover:underline"
                    >
                      {financier.email}
                    </a>
                  ) : (
                    muted("Not recorded")
                  ),
                },
                {
                  label: "Notes",
                  value: financier.notes ? (
                    <span className="whitespace-pre-line">{financier.notes}</span>
                  ) : (
                    muted("None")
                  ),
                },
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="pt-4">
          <RequirementsChecklist
            financierId={financier.id}
            financierName={financier.name}
            requirements={requirements}
          />
        </TabsContent>

        <TabsContent value="deals" className="pt-4">
          <FinancierDealsTable deals={deals} financierName={financier.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FinancierSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading financier">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <DataTableSkeleton columns={6} rows={5} />
    </div>
  );
}

export default function FinancierPage({ params }: PageProps<"/financiers/[id]">) {
  return (
    <Suspense fallback={<FinancierSkeleton />}>
      <FinancierView params={params} />
    </Suspense>
  );
}
