import { Building2Icon, ChevronLeftIcon, UserIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DateText } from "@/components/common/date-text";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Client360CreditChecks } from "@/features/clients/components/client-360-credit-checks";
import { Client360Documents } from "@/features/clients/components/client-360-documents";
import {
  Client360Activity,
  Client360Deals,
  Client360Directors,
  Client360Overview,
  Client360Repayments,
} from "@/features/clients/components/client-360-sections";
import { clientTypeLabel } from "@/features/clients/options";
import { getClient360, reliabilityBadge } from "@/features/clients/queries";
import { kycStatus } from "@/lib/status";

export const metadata: Metadata = { title: "Client" };

async function ClientView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getClient360(id);
  const Icon = data.client.client_type === "company" ? Building2Icon : UserIcon;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <Link href="/clients" className="inline-flex items-center gap-1 hover:text-foreground">
            <ChevronLeftIcon className="size-3.5" aria-hidden /> Clients
          </Link>
        }
        title={data.client.display_name}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              <Icon /> {clientTypeLabel[data.client.client_type]}
            </Badge>
            <StatusBadge status={kycStatus[data.client.kyc_status]} />
            <StatusBadge status={reliabilityBadge[data.reliability.badge]} />
          </div>
        }
        description={
          data.client.sector ? (
            <>
              {data.client.sector} · Added <DateText value={data.client.created_at} />
            </>
          ) : (
            "Client profile, KYC, credit history and financing activity."
          )
        }
      />
      <Tabs defaultValue="overview">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kyc">
            KYC &amp; Documents{" "}
            <span className="num text-muted-foreground">
              {data.summary.received_docs}/{data.summary.required_docs}
            </span>
          </TabsTrigger>
          <TabsTrigger value="directors">
            Directors <span className="num text-muted-foreground">{data.directors.length}</span>
          </TabsTrigger>
          <TabsTrigger value="credit">
            Credit checks{" "}
            <span className="num text-muted-foreground">{data.creditChecks.length}</span>
          </TabsTrigger>
          <TabsTrigger value="deals">
            Deals <span className="num text-muted-foreground">{data.deals.length}</span>
          </TabsTrigger>
          <TabsTrigger value="repayments">
            Repayments <span className="num text-muted-foreground">{data.schedules.length}</span>
          </TabsTrigger>
          <TabsTrigger value="activity">
            Activity <span className="num text-muted-foreground">{data.activities.length}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-4">
          <Client360Overview data={data} />
        </TabsContent>
        <TabsContent value="kyc" className="pt-4">
          <Client360Documents clientId={data.client.id} documents={data.documents} />
        </TabsContent>
        <TabsContent value="directors" className="pt-4">
          <Client360Directors data={data} />
        </TabsContent>
        <TabsContent value="credit" className="pt-4">
          <Client360CreditChecks
            clientId={data.client.id}
            creditChecks={data.creditChecks}
            exposures={data.exposures}
          />
        </TabsContent>
        <TabsContent value="deals" className="pt-4">
          <Client360Deals data={data} />
        </TabsContent>
        <TabsContent value="repayments" className="pt-4">
          <Client360Repayments data={data} />
        </TabsContent>
        <TabsContent value="activity" className="pt-4">
          <Client360Activity activities={data.activities} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClientSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading client">
      <div className="space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-surface-subtle" />
        <div className="h-7 w-72 animate-pulse rounded bg-surface-subtle" />
      </div>
      <DataTableSkeleton columns={6} rows={6} />
    </div>
  );
}

export default function ClientsIdPage({ params }: PageProps<"/clients/[id]">) {
  return (
    <Suspense fallback={<ClientSkeleton />}>
      <ClientView params={params} />
    </Suspense>
  );
}
