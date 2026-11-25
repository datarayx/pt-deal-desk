"use client";

import { ArrowRightIcon, BanknoteIcon, ReceiptTextIcon, WalletCardsIcon } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { KpiCard, type KpiDelta } from "@/components/common/kpi-card";
import { MoneyText } from "@/components/common/money-text";
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
import type { FinanceDashboardData } from "@/features/finance-dashboard/queries";
import { percentageDelta } from "@/features/dashboard/logic";

function deltaFor(
  metric: FinanceDashboardData["kpis"][keyof FinanceDashboardData["kpis"]],
  inverse = false,
): KpiDelta {
  const delta = percentageDelta(metric.current, metric.previous);
  const intent =
    delta.trend === "flat"
      ? "neutral"
      : inverse
        ? delta.trend === "up"
          ? "negative"
          : "positive"
        : delta.trend === "up"
          ? "positive"
          : "negative";
  return { ...delta, label: "vs last month", intent };
}

export function FinanceDashboardWorkspace({ data }: { data: FinanceDashboardData }) {
  const hasPnl = Number(data.pnl.income) !== 0 || Number(data.pnl.expenses) !== 0;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Cash / bank balance"
          value={<MoneyText value={data.kpis.cashBalance.current as string} compact />}
          delta={deltaFor(data.kpis.cashBalance)}
          variant="hero"
        />
        <KpiCard
          label="Fee receivables"
          value={<MoneyText value={data.kpis.receivables.current as string} compact />}
          delta={deltaFor(data.kpis.receivables, true)}
        />
        <KpiCard
          label="Payables"
          value={<MoneyText value={data.kpis.payables.current as string} compact />}
          delta={deltaFor(data.kpis.payables, true)}
        />
        <KpiCard
          label="Income this month"
          value={<MoneyText value={data.kpis.income.current as string} compact />}
          delta={deltaFor(data.kpis.income)}
        />
        <KpiCard
          label="Expenses this month"
          value={<MoneyText value={data.kpis.expenses.current as string} compact />}
          delta={deltaFor(data.kpis.expenses, true)}
        />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <CardTitle>P&amp;L snapshot</CardTitle>
            <CardDescription>{data.monthLabel} compared with the previous month.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/finance/reports">
              Open reports <ArrowRightIcon />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-5">
          {!hasPnl ? (
            <EmptyState
              variant="plain"
              icon={<ReceiptTextIcon />}
              title="No posted activity yet"
              description="Posted income and expenses will appear in the P&amp;L snapshot."
            />
          ) : (
            <Table mobileCards>
              <TableHeader>
                <TableRow>
                  <TableHead>Line</TableHead>
                  <TableHead className="text-right">This month</TableHead>
                  <TableHead className="text-right">Last month</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell data-label="Line" className="font-medium">
                    Income
                  </TableCell>
                  <TableCell data-label="This month" className="text-right">
                    <MoneyText value={data.pnl.income} />
                  </TableCell>
                  <TableCell data-label="Last month" className="text-right">
                    <MoneyText value={data.pnl.priorIncome} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell data-label="Line" className="font-medium">
                    Expenses
                  </TableCell>
                  <TableCell data-label="This month" className="text-right">
                    <MoneyText value={data.pnl.expenses} />
                  </TableCell>
                  <TableCell data-label="Last month" className="text-right">
                    <MoneyText value={data.pnl.priorExpenses} />
                  </TableCell>
                </TableRow>
                <TableRow className="font-semibold">
                  <TableCell data-label="Line">Net profit / (loss)</TableCell>
                  <TableCell data-label="This month" className="text-right">
                    <MoneyText value={data.pnl.profit} />
                  </TableCell>
                  <TableCell data-label="Last month" className="text-right">
                    <MoneyText value={data.pnl.priorProfit} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-3">
        <MiniLinkCard
          href="/finance/receivables"
          icon={<WalletCardsIcon />}
          title="Fee receivables"
          description="Review earned fees and record receipts."
        />
        <MiniLinkCard
          href="/finance/payables"
          icon={<BanknoteIcon />}
          title="Payables"
          description="Review referral fees and record payments."
        />
        <MiniLinkCard
          href="/finance/reports"
          icon={<ReceiptTextIcon />}
          title="Financial reports"
          description="Trial balance, P&amp;L, position and cash flows."
        />
      </div>
    </div>
  );
}

function MiniLinkCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-border-strong hover:bg-surface-subtle/60"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent-ink [&_svg]:size-4">
        {icon}
      </span>
      <span className="mt-4 block text-body font-semibold">{title}</span>
      <span className="mt-1 block text-small text-muted-foreground">{description}</span>
      <ArrowRightIcon className="mt-4 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
