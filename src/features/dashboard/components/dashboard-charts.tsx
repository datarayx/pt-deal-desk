"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--text)",
  fontSize: 12,
};

function ChartFrame({ children }: { children: React.ReactNode }) {
  return <div className="h-64 w-full min-w-0">{children}</div>;
}

export function PipelineChart({ data }: { data: PipelineChartRow[] }) {
  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 14, left: 8, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickFormatter={(value) => formatNaira(value, { compact: true }) ?? "₦0"}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="stage"
            width={116}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatNaira(Number(value ?? 0)) ?? "₦0.00", "Pipeline"]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
            {data.map((row) => (
              <Cell key={row.stage} fill={row.color ?? "var(--chart-1)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function FeesChart({ data }: { data: FeeChartRow[] }) {
  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => formatNaira(value, { compact: true }) ?? "₦0"}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={58}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              formatNaira(Number(value ?? 0)) ?? "₦0.00",
              name === "earned" ? "Earned" : "Received",
            ]}
          />
          <Bar dataKey="earned" name="earned" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="received" name="received" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function RepaymentsDueChart({ data }: { data: RepaymentChartRow[] }) {
  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => formatNaira(value, { compact: true }) ?? "₦0"}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={58}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatNaira(Number(value ?? 0)) ?? "₦0.00", "Due"]}
          />
          <Bar dataKey="amount" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function OverdueAgeingChart({ data }: { data: AgeingChartRow[] }) {
  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="bucket"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => formatNaira(value, { compact: true }) ?? "₦0"}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={58}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatNaira(Number(value ?? 0)) ?? "₦0.00", "Overdue"]}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {data.map((row, index) => (
              <Cell key={row.bucket} fill={index === 0 ? "var(--warning)" : "var(--danger)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
