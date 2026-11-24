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
import { FeeTerms } from "@/features/referrers/components/fee-terms";
import { ReferredClientsTable } from "@/features/referrers/components/referred-clients-table";
import { ReferrerActions } from "@/features/referrers/components/referrer-actions";
import { ReferrerDealsTable } from "@/features/referrers/components/referrer-deals-table";
import { getReferrer } from "@/features/referrers/queries";
import { referrerTypeLabel } from "@/features/referrers/schemas";

export const metadata: Metadata = { title: "Referrer" };

const muted = (text: string) => <span className="text-muted-foreground">{text}</span>;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

async function ReferrerView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { referrer, clients, deals } = await getReferrer(id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <Link href="/referrers" className="inline-flex items-center gap-1 hover:text-foreground">
            <ChevronLeftIcon className="size-3.5" aria-hidden /> Referrers
          </Link>
        }
        title={referrer.name}
        meta={<Badge variant="outline">{referrerTypeLabel[referrer.referrer_type]}</Badge>}
        description={
          referrer.contact_person && referrer.contact_person !== referrer.name
            ? `Contact: ${referrer.contact_person}`
            : undefined
        }
        actions={<ReferrerActions referrer={referrer} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Clients referred"
          value={<span className="num">{referrer.clients_referred}</span>}
          sub={plural(referrer.deal_count, "deal") + " from them"}
        />
        <KpiCard
          label="Deals funded"
          value={<span className="num">{referrer.deals_funded}</span>}
          sub={
            <>
              <MoneyText value={referrer.amount_funded} compact /> disbursed
            </>
          }
        />
        <KpiCard
          variant="hero"
          label="Referral fees earned"
          value={<MoneyText value={referrer.fees_earned} compact />}
          sub={
            <>
              <MoneyText value={referrer.fees_paid} /> paid out
            </>
          }
        />
        <KpiCard
          label="Still to pay"
          value={<MoneyText value={referrer.fees_payable} compact />}
          sub={
            referrer.fees_pending_count > 0
              ? `${plural(referrer.fees_pending_count, "more fee")} due when deals fund`
              : "No other fees agreed"
          }
        />{" "}
      </div>

      <Tabs defaultValue="deals">
        <TabsList>
          <TabsTrigger value="deals">
            Deals <span className="num text-muted-foreground">{deals.length}</span>
          </TabsTrigger>
          <TabsTrigger value="clients">
            Clients <span className="num text-muted-foreground">{clients.length}</span>
          </TabsTrigger>
          <TabsTrigger value="overview">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="deals" className="pt-4">
          <ReferrerDealsTable deals={deals} referrerName={referrer.name} />
        </TabsContent>

        <TabsContent value="clients" className="pt-4">
          <ReferredClientsTable clients={clients} referrerName={referrer.name} />
        </TabsContent>

        <TabsContent value="overview" className="pt-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <DetailList
              rows={[
                { label: "Type", value: referrerTypeLabel[referrer.referrer_type] },
                {
                  label: "Contact person",
                  value: referrer.contact_person ?? muted("Not recorded"),
                },
                {
                  label: "Phone",
                  value: referrer.phone ? (
                    <a
                      href={`tel:${referrer.phone}`}
                      className="num hover:text-accent-ink hover:underline"
                    >
                      {referrer.phone}
                    </a>
                  ) : (
                    muted("Not recorded")
                  ),
                },
                {
                  label: "Email",
                  value: referrer.email ? (
                    <a
                      href={`mailto:${referrer.email}`}
                      className="hover:text-accent-ink hover:underline"
                    >
                      {referrer.email}
                    </a>
                  ) : (
                    muted("Not recorded")
                  ),
                },
                {
                  label: "Usual referral fee",
                  hint: "Each deal records its own agreed fee",
                  value: referrer.default_fee_type ? (
                    <span className="inline-flex items-baseline gap-1.5">
                      <FeeTerms
                        basis={referrer.default_fee_type}
                        value={referrer.default_fee_value}
                      />
                      {referrer.default_fee_type === "percent" && muted("of the disbursed amount")}
                    </span>
                  ) : (
                    muted("None set")
                  ),
                },
                { label: "Bank", value: referrer.bank_name ?? muted("Not recorded") },
                { label: "Account name", value: referrer.account_name ?? muted("Not recorded") },
              ]}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReferrerSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading referrer">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <DataTableSkeleton columns={7} rows={5} />
    </div>
  );
}

export default function ReferrerPage({ params }: PageProps<"/referrers/[id]">) {
  return (
    <Suspense fallback={<ReferrerSkeleton />}>
      <ReferrerView params={params} />
    </Suspense>
  );
}
