"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatNaira } from "@/lib/format/money";
import type {
  AgeingChartRow,
  FeeChartRow,
  PipelineChartRow,
  RepaymentChartRow,
} from "@/features/dashboard/queries";

const tooltipStyle = {
  backgroundColor: "var(--surface-raised)",
  border: "1px solid var(--border-strong)",
  borderRadius: "10px",
  boxShadow: "var(--shadow-overlay)",
  color: "var(--text)",
  fontSize: 12,
};

const axisTick = { fill: "var(--text-muted)", fontSize: 11 };

function ChartFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="h-72 w-full min-w-0 md:h-80" role="img" aria-label={label}>
      {children}
    </div>
  );
}

function Legend({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-muted-foreground">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function PipelineChart({ data }: { data: PipelineChartRow[] }) {
  return (
    <ChartFrame label="Pipeline value by deal stage">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 56, left: 8, bottom: 8 }}
          barCategoryGap="28%"
        >
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.55} />
          <XAxis
            type="number"
            tickFormatter={(value) => formatNaira(value, { compact: true }) ?? "₦0"}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            type="category"
            dataKey="stage"
            width={116}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-subtle)", opacity: 0.65 }}
            contentStyle={tooltipStyle}
            formatter={(value) => [formatNaira(Number(value ?? 0)) ?? "₦0.00", "Pipeline"]}
          />
          <Bar
            dataKey="value"
            radius={[0, 8, 8, 0]}
            barSize={22}
            isAnimationActive={false}
          >
            {data.map((row) => (
              <Cell key={row.stage} fill={row.color ?? "var(--chart-1)"} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              fill="var(--text-muted)"
              fontSize={11}
              formatter={(value) => `${value} deal${Number(value) === 1 ? "" : "s"}`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function FeesChart({ data }: { data: FeeChartRow[] }) {
  return (
    <div className="space-y-3">
      <Legend
        items={[
          { label: "Earned", color: "var(--chart-1)" },
          { label: "Received", color: "var(--chart-2)" },
        ]}
      />
      <ChartFrame label="Fees earned and received over the last six months">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id="fees-earned-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fees-received-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.55} />
            <XAxis
              dataKey="month"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              tickFormatter={(value) => formatNaira(value, { compact: true }) ?? "₦0"}
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              width={58}
            />
            <Tooltip
              cursor={{ stroke: "var(--border-strong)", strokeDasharray: "4 4" }}
              contentStyle={tooltipStyle}
              formatter={(value, name) => [
                formatNaira(Number(value ?? 0)) ?? "₦0.00",
                name === "earned" ? "Earned" : "Received",
              ]}
            />
            <Area
              type="monotone"
              dataKey="earned"
              name="earned"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              fill="url(#fees-earned-fill)"
              dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface)" }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="received"
              name="received"
              stroke="var(--chart-2)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--chart-2)", strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface)" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}

export function RepaymentsDueChart({ data }: { data: RepaymentChartRow[] }) {
  return (
    <ChartFrame label="Repayment balances due over the next thirty days">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
          barCategoryGap="28%"
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.55} />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} tickMargin={8} />
          <YAxis
            tickFormatter={(value) => formatNaira(value, { compact: true }) ?? "₦0"}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={58}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-subtle)", opacity: 0.65 }}
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              name === "amount"
                ? formatNaira(Number(value ?? 0)) ?? "₦0.00"
                : `${value} instalment${Number(value) === 1 ? "" : "s"}`,
              name === "amount" ? "Due" : "Instalments",
            ]}
          />
          <Bar
            dataKey="amount"
            fill="var(--chart-3)"
            radius={[8, 8, 2, 2]}
            barSize={30}
            isAnimationActive={false}
          >
            <LabelList dataKey="count" position="top" fill="var(--text-muted)" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function OverdueAgeingChart({ data }: { data: AgeingChartRow[] }) {
  return (
    <ChartFrame label="Outstanding overdue balance by ageing bucket">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 18, left: 8, bottom: 8 }}
          barCategoryGap="25%"
        >
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.55} />
          <XAxis
            type="number"
            tickFormatter={(value) => formatNaira(value, { compact: true }) ?? "₦0"}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            type="category"
            dataKey="bucket"
            width={54}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-subtle)", opacity: 0.65 }}
            contentStyle={tooltipStyle}
            formatter={(value) => [formatNaira(Number(value ?? 0)) ?? "₦0.00", "Overdue"]}
          />
          <Bar dataKey="amount" radius={[0, 8, 8, 0]} barSize={24} isAnimationActive={false}>
            {data.map((row, index) => (
              <Cell key={row.bucket} fill={index === 0 ? "var(--warning)" : "var(--danger)"} />
            ))}
            <LabelList dataKey="count" position="right" fill="var(--text-muted)" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

