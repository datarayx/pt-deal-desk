"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoneyText } from "@/components/common/money-text";
import { ReportExportButtons } from "@/features/reports/components/report-export-buttons";
import { PeriodPicker } from "@/features/reports/components/period-picker";
import {
  buildBalanceSheet,
  buildCashFlow,
  buildProfitAndLoss,
  buildTrialBalance,
  previousPeriod,
  type PeriodRange,
  type ReportRow,
} from "@/features/reports/logic";
import { isoMonth, rangeForMonth } from "@/features/reports/periods";
import type { ReportData } from "@/features/reports/queries";
import type { ExportTable } from "@/lib/export/types";

type ReportTab = "trial" | "profit" | "position" | "cash";
type ComparisonRow = { code: string; name: string; current: string; prior: string };

export function ReportsWorkspace({ data }: { data: ReportData }) {
  const [tab, setTab] = useState<ReportTab>("trial");
  const [range, setRange] = useState<PeriodRange>(() => rangeForMonth(isoMonth()));
  const comparison = useMemo(() => previousPeriod(range), [range]);
  const report = useMemo(
    () => ({
      trial: {
        current: buildTrialBalance(data.lines, data.accounts, range),
        prior: buildTrialBalance(data.lines, data.accounts, comparison),
      },
      profit: {
        current: buildProfitAndLoss(data.lines, data.accounts, range),
        prior: buildProfitAndLoss(data.lines, data.accounts, comparison),
      },
      position: {
        current: buildBalanceSheet(data.lines, data.accounts, range.to),
        prior: buildBalanceSheet(data.lines, data.accounts, comparison.to),
      },
      cash: {
        current: buildCashFlow(data.lines, data.accounts, range),
        prior: buildCashFlow(data.lines, data.accounts, comparison),
      },
    }),
    [comparison, data.accounts, data.lines, range],
  );
  return (
    <div className="space-y-5">
      <PeriodPicker onChange={setRange} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(value) => setTab(value as ReportTab)}>
          <TabsList>
            <TabsTrigger value="trial">Trial balance</TabsTrigger>
            <TabsTrigger value="profit">Profit or loss</TabsTrigger>
            <TabsTrigger value="position">Financial position</TabsTrigger>
            <TabsTrigger value="cash">Cash flows</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-small text-muted-foreground">
          Comparison: <span className="num">{comparison.from}</span> →{" "}
          <span className="num">{comparison.to}</span>
        </p>
      </div>
      {tab === "trial" && (
        <TrialView
          current={report.trial.current}
          prior={report.trial.prior}
          range={range}
          comparison={comparison}
          company={data.company}
        />
      )}
      {tab === "profit" && (
        <ProfitView
          current={report.profit.current}
          prior={report.profit.prior}
          range={range}
          comparison={comparison}
          company={data.company}
        />
      )}
      {tab === "position" && (
        <PositionView
          current={report.position.current}
          prior={report.position.prior}
          range={range}
          comparison={comparison}
          company={data.company}
        />
      )}
      {tab === "cash" && (
        <CashView
          current={report.cash.current}
          prior={report.cash.prior}
          range={range}
          comparison={comparison}
          company={data.company}
        />
      )}
    </div>
  );
}

function exportCompany(company: ReportData["company"]) {
  return {
    companyName: company.name,
    companyAddress: company.address,
    companyPhone: company.phone,
    companyEmail: company.email,
  };
}

function mergeRows(current: ReportRow[], prior: ReportRow[]): ComparisonRow[] {
  const map = new Map<string, ComparisonRow>();
  for (const row of current)
    map.set(row.code, { code: row.code, name: row.name, current: row.amount, prior: "0.00" });
  for (const row of prior)
    map.set(row.code, {
      ...(map.get(row.code) ?? { code: row.code, name: row.name, current: "0.00" }),
      prior: row.amount,
    });
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}

function ReportTable({
  rows,
  currentLabel,
  priorLabel,
  table,
  totalLabel,
  currentTotal,
  priorTotal,
  money = true,
}: {
  rows: ComparisonRow[];
  currentLabel: string;
  priorLabel: string;
  table: ExportTable;
  totalLabel?: string;
  currentTotal?: string;
  priorTotal?: string;
  money?: boolean;
}) {
  const cell = (value: string) =>
    money ? <MoneyText value={value} /> : <span className="num">{value}</span>;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{table.title}</CardTitle>
            <CardDescription>
              {currentLabel} compared with {priorLabel}
            </CardDescription>
          </div>
          <ReportExportButtons table={table} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-small">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-2 py-2">Account</th>
                <th className="px-2 py-2 text-right">{currentLabel}</th>
                <th className="px-2 py-2 text-right">{priorLabel}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.code} className="border-b border-border/60">
                  <td className="px-2 py-2">
                    <span className="mr-3 num text-muted-foreground">{row.code}</span>
                    {row.name}
                  </td>
                  <td className="px-2 py-2 text-right">{cell(row.current)}</td>
                  <td className="px-2 py-2 text-right">{cell(row.prior)}</td>
                </tr>
              ))}
            </tbody>
            {totalLabel && (
              <tfoot>
                <tr className="font-semibold">
                  <td className="px-2 py-3">{totalLabel}</td>
                  <td className="px-2 py-3 text-right">{cell(currentTotal ?? "0.00")}</td>
                  <td className="px-2 py-3 text-right">{cell(priorTotal ?? "0.00")}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function TrialView({
  current,
  prior,
  range,
  comparison,
  company,
}: {
  current: ReturnType<typeof buildTrialBalance>;
  prior: ReturnType<typeof buildTrialBalance>;
  range: PeriodRange;
  comparison: PeriodRange;
  company: ReportData["company"];
}) {
  const map = new Map<
    string,
    {
      code: string;
      name: string;
      type: string;
      debit: string;
      credit: string;
      priorDebit: string;
      priorCredit: string;
    }
  >();
  for (const row of current.rows)
    map.set(row.code, { ...row, priorDebit: "0.00", priorCredit: "0.00" });
  for (const row of prior.rows)
    map.set(row.code, {
      ...(map.get(row.code) ?? {
        code: row.code,
        name: row.name,
        type: row.type,
        debit: "0.00",
        credit: "0.00",
      }),
      priorDebit: row.debit,
      priorCredit: row.credit,
    });
  const rows = [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
  const table: ExportTable = {
    title: `Trial balance · ${range.label}`,
    columns: ["Code", "Account", "Current debit", "Current credit", "Prior debit", "Prior credit"],
    rows: rows
      .map((row) => [row.code, row.name, row.debit, row.credit, row.priorDebit, row.priorCredit])
      .concat([
        [
          "",
          "Totals",
          current.debitTotal,
          current.creditTotal,
          prior.debitTotal,
          prior.creditTotal,
        ],
      ]),
    ...exportCompany(company),
  };
  return (
    <ReportTable
      rows={rows.map((row) => ({
        code: row.code,
        name: `${row.name} · ${row.type}`,
        current: `${row.debit} Dr / ${row.credit} Cr`,
        prior: `${row.priorDebit} Dr / ${row.priorCredit} Cr`,
      }))}
      currentLabel={`${range.label} · Dr / Cr`}
      priorLabel={`${comparison.label} · Dr / Cr`}
      table={table}
      totalLabel="Totals · Dr / Cr"
      currentTotal={`${current.debitTotal} / ${current.creditTotal}`}
      priorTotal={`${prior.debitTotal} / ${prior.creditTotal}`}
      money={false}
    />
  );
}

function pnlRows(
  current: ReturnType<typeof buildProfitAndLoss>,
  prior: ReturnType<typeof buildProfitAndLoss>,
) {
  const sections = [
    { title: "Revenue", current: current.revenueRows, prior: prior.revenueRows },
    { title: "Other income", current: current.otherIncomeRows, prior: prior.otherIncomeRows },
    { title: "Operating expenses", current: current.expenseRows, prior: prior.expenseRows },
    { title: "Tax", current: current.taxRows, prior: prior.taxRows },
  ];
  return sections.map((section) => ({
    ...section,
    rows: mergeRows(section.current, section.prior),
  }));
}

function ProfitView({
  current,
  prior,
  range,
  comparison,
  company,
}: {
  current: ReturnType<typeof buildProfitAndLoss>;
  prior: ReturnType<typeof buildProfitAndLoss>;
  range: PeriodRange;
  comparison: PeriodRange;
  company: ReportData["company"];
}) {
  const sections = pnlRows(current, prior);
  const summary: ComparisonRow[] = [
    {
      code: "",
      name: "Profit before tax",
      current: current.profitBeforeTax,
      prior: prior.profitBeforeTax,
    },
    { code: "", name: "Profit for the period", current: current.profit, prior: prior.profit },
  ];
  const exportRows = sections.flatMap((section) => [
    ["", section.title, "", ""],
    ...section.rows.map((row) => [row.code, row.name, row.current, row.prior]),
  ]);
  exportRows.push(
    ["", "Profit before tax", current.profitBeforeTax, prior.profitBeforeTax],
    ["", "Profit for the period", current.profit, prior.profit],
  );
  const table: ExportTable = {
    title: `Statement of profit or loss · ${range.label}`,
    columns: ["Code", "Line", range.label, comparison.label],
    rows: exportRows,
    ...exportCompany(company),
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ReportExportButtons table={table} />
      </div>
      {sections.map((section) => (
        <ReportTable
          key={section.title}
          rows={section.rows}
          currentLabel={range.label}
          priorLabel={comparison.label}
          table={{
            ...table,
            title: `${table.title} · ${section.title}`,
            rows: section.rows.map((row) => [row.code, row.name, row.current, row.prior]),
          }}
        />
      ))}
      <ReportTable
        rows={summary}
        currentLabel={range.label}
        priorLabel={comparison.label}
        table={{
          ...table,
          title: `${table.title} · Summary`,
          rows: summary.map((row) => [row.code, row.name, row.current, row.prior]),
        }}
      />
    </div>
  );
}

function positionRows(
  current: ReturnType<typeof buildBalanceSheet>,
  prior: ReturnType<typeof buildBalanceSheet>,
) {
  return [
    { title: "Assets", current: current.assets, prior: prior.assets },
    { title: "Liabilities", current: current.liabilities, prior: prior.liabilities },
    {
      title: "Equity",
      current: [
        ...current.equity,
        { code: "PROFIT", name: "Retained earnings / profit to date", amount: current.profit },
      ],
      prior: [
        ...prior.equity,
        { code: "PROFIT", name: "Retained earnings / profit to date", amount: prior.profit },
      ],
    },
  ].map((section) => ({ ...section, rows: mergeRows(section.current, section.prior) }));
}

function PositionView({
  current,
  prior,
  range,
  comparison,
  company,
}: {
  current: ReturnType<typeof buildBalanceSheet>;
  prior: ReturnType<typeof buildBalanceSheet>;
  range: PeriodRange;
  comparison: PeriodRange;
  company: ReportData["company"];
}) {
  const sections = positionRows(current, prior);
  const table: ExportTable = {
    title: `Statement of financial position · ${range.to}`,
    columns: ["Section", "Code", "Line", `As at ${range.to}`, `As at ${comparison.to}`],
    rows: sections.flatMap((section) => [
      [section.title, "", "", "", ""],
      ...section.rows.map((row) => [section.title, row.code, row.name, row.current, row.prior]),
    ]),
    ...exportCompany(company),
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ReportExportButtons table={table} />
      </div>
      {sections.map((section) => (
        <ReportTable
          key={section.title}
          rows={section.rows}
          currentLabel={`As at ${range.to}`}
          priorLabel={`As at ${comparison.to}`}
          table={{
            title: `Statement of financial position · ${section.title} · ${range.to}`,
            columns: ["Code", "Line", `As at ${range.to}`, `As at ${comparison.to}`],
            rows: section.rows.map((row) => [row.code, row.name, row.current, row.prior]),
            ...exportCompany(company),
          }}
        />
      ))}
      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
          <div>
            <p className="text-small text-muted-foreground">Assets</p>
            <MoneyText value={current.totalAssets} />
          </div>
          <div>
            <p className="text-small text-muted-foreground">Liabilities + equity</p>
            <MoneyText value={addMoney(current.totalLiabilities, current.totalEquity)} />
          </div>
          <div>
            <p className="text-small text-muted-foreground">Balance check</p>
            <Badge variant={current.difference === "0.00" ? "success" : "danger"}>
              {current.difference === "0.00" ? "Balanced" : current.difference}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function addMoney(left: string, right: string) {
  const parse = (value: string) => {
    const negative = value.startsWith("-");
    const clean = negative ? value.slice(1) : value;
    const [whole = "0", fraction = ""] = clean.split(".");
    const cents = BigInt(whole) * BigInt(100) + BigInt((fraction + "00").slice(0, 2));
    return negative ? -cents : cents;
  };
  const format = (value: bigint) => {
    const negative = value < BigInt(0);
    const absolute = negative ? -value : value;
    return `${negative ? "-" : ""}${absolute / BigInt(100)}.${(absolute % BigInt(100)).toString().padStart(2, "0")}`;
  };
  return format(parse(left) + parse(right));
}

function cashRows(
  current: ReturnType<typeof buildCashFlow>,
  prior: ReturnType<typeof buildCashFlow>,
) {
  const section = (title: string, currentRows: ReportRow[], priorRows: ReportRow[]) => ({
    title,
    rows: mergeRows(currentRows, priorRows),
  });
  return [
    section(
      "Operating activities",
      [
        { code: "PROFIT", name: "Profit for the period", amount: current.profit },
        { code: "5800", name: "Depreciation", amount: current.depreciation },
        ...current.operatingAdjustments,
      ],
      [
        { code: "PROFIT", name: "Profit for the period", amount: prior.profit },
        { code: "5800", name: "Depreciation", amount: prior.depreciation },
        ...prior.operatingAdjustments,
      ],
    ),
    section("Investing activities", current.investing, prior.investing),
    section("Financing activities", current.financing, prior.financing),
  ];
}

function CashView({
  current,
  prior,
  range,
  comparison,
  company,
}: {
  current: ReturnType<typeof buildCashFlow>;
  prior: ReturnType<typeof buildCashFlow>;
  range: PeriodRange;
  comparison: PeriodRange;
  company: ReportData["company"];
}) {
  const sections = cashRows(current, prior);
  const table: ExportTable = {
    title: `Statement of cash flows · ${range.label}`,
    columns: ["Section", "Code", "Line", range.label, comparison.label],
    rows: sections.flatMap((section) => [
      [section.title, "", "", "", ""],
      ...section.rows.map((row) => [section.title, row.code, row.name, row.current, row.prior]),
    ]),
    ...exportCompany(company),
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ReportExportButtons table={table} />
      </div>
      {sections.map((section) => (
        <ReportTable
          key={section.title}
          rows={section.rows}
          currentLabel={range.label}
          priorLabel={comparison.label}
          table={{
            title: `Statement of cash flows · ${section.title} · ${range.label}`,
            columns: ["Code", "Line", range.label, comparison.label],
            rows: section.rows.map((row) => [row.code, row.name, row.current, row.prior]),
            ...exportCompany(company),
          }}
        />
      ))}
      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
          <div>
            <p className="text-small text-muted-foreground">Net cash change</p>
            <MoneyText value={current.netChange} />
          </div>
          <div>
            <p className="text-small text-muted-foreground">Actual bank movement</p>
            <MoneyText value={current.actualCashMovement} />
          </div>
          <div>
            <p className="text-small text-muted-foreground">Reconciliation</p>
            <Badge variant={current.reconciliationDifference === "0.00" ? "success" : "danger"}>
              {current.reconciliationDifference === "0.00"
                ? "Reconciles"
                : current.reconciliationDifference}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
