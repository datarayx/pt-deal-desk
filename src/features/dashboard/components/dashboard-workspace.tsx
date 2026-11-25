"use client";

import {
  ArrowRightIcon,
  BarChart3Icon,
  CalendarClockIcon,
  PhoneCallIcon,
  TrophyIcon,
} from "lucide-react";
import Link from "next/link";

import { DateText } from "@/components/common/date-text";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCard, type KpiDelta } from "@/components/common/kpi-card";
import { MoneyText } from "@/components/common/money-text";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardCallSheet } from "@/features/dashboard/components/dashboard-call-sheet";
import {
  FeesChart,
  OverdueAgeingChart,
  PipelineChart,
  RepaymentsDueChart,
} from "@/features/dashboard/components/dashboard-charts";
import type { DashboardData } from "@/features/dashboard/queries";
import { percentageDelta, type DashboardKpi } from "@/features/dashboard/logic";
import { repaymentStatus } from "@/lib/status";

function deltaFor(metric: DashboardKpi, inverse = false): KpiDelta {
  const delta = percentageDelta(metric.current, metric.previous);
  const positive =
    delta.trend === "flat"
      ? "neutral"
      : inverse
        ? delta.trend === "up"
          ? "negative"
          : "positive"
        : delta.trend === "up"
          ? "positive"
          : "negative";
  return { ...delta, label: "vs last month", intent: positive };
}

function Widget({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

function EmptyWidget({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return <EmptyState variant="plain" icon={icon} title={title} description={description} />;
}

export function DashboardWorkspace({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Pipeline value"
          value={<MoneyText value={data.kpis.pipelineValue.current as string} compact />}
          delta={deltaFor(data.kpis.pipelineValue)}
          variant="hero"
        />
        <KpiCard
          label="Active deals"
          value={data.kpis.activeDeals.current}
          delta={deltaFor(data.kpis.activeDeals)}
        />
        <KpiCard
          label="Outstanding balance"
          value={<MoneyText value={data.kpis.outstandingBalance.current as string} compact />}
          delta={deltaFor(data.kpis.outstandingBalance, true)}
        />
        <KpiCard
          label="Overdue amount"
          value={<MoneyText value={data.kpis.overdueAmount.current as string} compact />}
          delta={deltaFor(data.kpis.overdueAmount, true)}
        />
        <KpiCard
          label="Portfolio at risk"
          value={`${Number(data.kpis.portfolioAtRisk.current).toFixed(1)}%`}
          delta={deltaFor(data.kpis.portfolioAtRisk, true)}
        />
        <KpiCard
          label="Fees earned MTD"
          value={<MoneyText value={data.kpis.feesEarnedMtd.current as string} compact />}
          delta={deltaFor(data.kpis.feesEarnedMtd)}
        />
        <KpiCard
          label="Fees earned YTD"
          value={<MoneyText value={data.kpis.feesEarnedYtd.current as string} compact />}
          delta={deltaFor(data.kpis.feesEarnedYtd)}
        />
        <KpiCard
          label="Fees receivable"
          value={<MoneyText value={data.kpis.feesReceivable.current as string} compact />}
          delta={deltaFor(data.kpis.feesReceivable, true)}
        />
      </div>

      <Widget
        title="Ongoing transactions"
        description="Open deals requiring attention."
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href="/deals">
              View deals <ArrowRightIcon />
            </Link>
          </Button>
        }
      >
        {data.ongoingTransactions.length === 0 ? (
          <EmptyWidget
            icon={<BarChart3Icon />}
            title="No ongoing transactions"
            description="New open deals will appear here as they enter the pipeline."
          />
        ) : (
          <Table mobileCards>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Financier</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Deficiencies</TableHead>
                <TableHead className="text-right">Days in stage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.ongoingTransactions.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell data-label="Client">
                    <Link
                      href={`/deals/${deal.id}`}
                      className="font-medium text-accent-ink hover:underline"
                    >
                      {deal.client_name}
                    </Link>
                    <span className="block text-caption text-muted-foreground">
                      {deal.reference}
                    </span>
                  </TableCell>
                  <TableCell data-label="Financier">
                    {deal.financier_name ?? (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell data-label="Amount" className="text-right">
                    <MoneyText value={dealAmountForView(deal)} />
                  </TableCell>
                  <TableCell data-label="Stage">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: deal.stage_color ?? "var(--chart-4)" }}
                      />
                      {deal.stage_name}
                    </span>
                  </TableCell>
                  <TableCell data-label="Deficiencies" className="text-right">
                    {deal.deficiency_count > 0 ? (
                      <span className="text-warning">{deal.deficiency_count}</span>
                    ) : (
                      <span className="text-success">0</span>
                    )}
                  </TableCell>
                  <TableCell data-label="Days in stage" className="text-right num">
                    {deal.days_in_stage}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Widget>

      <div className="grid gap-6 xl:grid-cols-2">
        <Widget
          title="Repayments due next 14 days"
          description="Unpaid instalments by due date."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/repayments">
                View repayments <ArrowRightIcon />
              </Link>
            </Button>
          }
        >
          {data.dueSoon.length === 0 ? (
            <EmptyWidget
              icon={<CalendarClockIcon />}
              title="Nothing due soon"
              description="Repayments due in the next 14 days will appear here."
            />
          ) : (
            <RepaymentTable rows={data.dueSoon} />
          )}
        </Widget>
        <Widget
          title="Overdue repayments"
          description="Unconfirmed balances needing follow-up."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/repayments">
                View overdue <ArrowRightIcon />
              </Link>
            </Button>
          }
        >
          {data.overdue.length === 0 ? (
            <EmptyWidget
              icon={<PhoneCallIcon />}
              title="No overdue repayments"
              description="Unconfirmed past-due instalments will appear here."
            />
          ) : (
            <Table mobileCards>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.overdue.slice(0, 8).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell data-label="Client">
                      <Link
                        href={`/deals/${row.deal_id}`}
                        className="font-medium text-accent-ink hover:underline"
                      >
                        {row.client_name}
                      </Link>
                      <span className="block text-caption text-muted-foreground">
                        {row.reference}
                      </span>
                    </TableCell>
                    <TableCell data-label="Due">
                      <DateText value={row.due_date} />
                    </TableCell>
                    <TableCell data-label="Outstanding" className="text-right">
                      <MoneyText value={row.outstanding} />
                    </TableCell>
                    <TableCell data-label="Age">
                      <StatusBadge
                        status={repaymentStatus.overdue}
                        detail={`${row.days_overdue} days`}
                      />
                    </TableCell>
                    <TableCell data-label="Action">
                      <DashboardCallSheet
                        scheduleId={row.id}
                        dealId={row.deal_id}
                        clientName={row.client_name}
                        reference={row.reference}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Widget>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Widget
          title="Pipeline by stage"
          description="Open and negotiating deal value."
          action={
            <span className="text-caption text-muted-foreground">
              {data.pipeline.reduce((total, row) => total + row.count, 0)} active deals
            </span>
          }
        >
          {data.pipeline.length === 0 || data.pipeline.every((row) => row.value === 0) ? (
            <EmptyWidget
              icon={<BarChart3Icon />}
              title="No pipeline yet"
              description="Pipeline value will appear as deals are created."
            />
          ) : (
            <PipelineChart data={data.pipeline} />
          )}
        </Widget>
        <Widget title="Fees earned vs received" description="Last six months, in ₦.">
          {data.feesByMonth.every((row) => row.earned === 0 && row.received === 0) ? (
            <EmptyWidget
              icon={<BarChart3Icon />}
              title="No fee history yet"
              description="Recognised and received fees will appear here."
            />
          ) : (
            <FeesChart data={data.feesByMonth} />
          )}
        </Widget>
        <Widget
          title="Repayments due next 30 days"
          description="Outstanding balance grouped into weekly windows."
        >
          {data.repaymentsDue30.every((row) => row.amount === 0) ? (
            <EmptyWidget
              icon={<CalendarClockIcon />}
              title="No repayments due"
              description="Upcoming repayment balances will appear here."
            />
          ) : (
            <RepaymentsDueChart data={data.repaymentsDue30} />
          )}
        </Widget>
        <Widget title="Overdue ageing" description="Outstanding overdue balance by age.">
          {data.overdueAgeing.every((row) => row.amount === 0) ? (
            <EmptyWidget
              icon={<PhoneCallIcon />}
              title="No overdue ageing"
              description="Ageing buckets appear when an instalment becomes overdue."
            />
          ) : (
            <OverdueAgeingChart data={data.overdueAgeing} />
          )}
        </Widget>
      </div>

      <Widget title="Top referrers" description="Funded deals and fee contribution.">
        {data.topReferrers.length === 0 ? (
          <EmptyWidget
            icon={<TrophyIcon />}
            title="No referrer activity"
            description="Funded referral activity will appear here."
          />
        ) : (
          <Table mobileCards>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead className="text-right">Funded deals</TableHead>
                <TableHead className="text-right">Amount funded</TableHead>
                <TableHead className="text-right">Fees earned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topReferrers.map((row) => (
                <TableRow key={row.id}>
                  <TableCell data-label="Referrer" className="font-medium">
                    {row.name}
                  </TableCell>
                  <TableCell data-label="Funded deals" className="text-right num">
                    {row.deals_funded}
                  </TableCell>
                  <TableCell data-label="Amount funded" className="text-right">
                    <MoneyText value={row.amount_funded} />
                  </TableCell>
                  <TableCell data-label="Fees earned" className="text-right">
                    <MoneyText value={row.fees_earned} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Widget>
    </div>
  );
}

function dealAmountForView(deal: DashboardData["ongoingTransactions"][number]) {
  return deal.amount_disbursed ?? deal.amount_approved ?? deal.amount_requested ?? "0.00";
}

function RepaymentTable({ rows }: { rows: DashboardData["dueSoon"] }) {
  return (
    <Table mobileCards>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Due</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.slice(0, 8).map((row) => (
          <TableRow key={row.id}>
            <TableCell data-label="Client">
              <Link
                href={`/deals/${row.deal_id}`}
                className="font-medium text-accent-ink hover:underline"
              >
                {row.client_name}
              </Link>
              <span className="block text-caption text-muted-foreground">{row.reference}</span>
            </TableCell>
            <TableCell data-label="Due">
              <DateText value={row.due_date} />
              <span className="ml-2 text-caption text-muted-foreground">
                {row.days_until_due === 0 ? "today" : `in ${row.days_until_due}d`}
              </span>
            </TableCell>
            <TableCell data-label="Amount" className="text-right">
              <MoneyText value={row.outstanding} />
            </TableCell>
            <TableCell data-label="Status">
              <StatusBadge
                status={row.days_until_due <= 0 ? repaymentStatus.due : repaymentStatus.scheduled}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

