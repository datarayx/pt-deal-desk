import { KpiCard } from "@/components/common/kpi-card";
import { MoneyText } from "@/components/common/money-text";

export function KpiGallery() {
  return (
    <div className="grid gap-4 pt-4 sm:grid-cols-2">
      <KpiCard
        variant="hero"
        label="Pipeline value"
        value={<MoneyText value="1284500000" compact />}
        delta={{ value: "+12.4%", trend: "up", label: "vs last month" }}
        sparkline={[620, 700, 680, 810, 790, 940, 1010, 1180, 1284]}
      />
      <KpiCard
        label="Outstanding balance"
        value={<MoneyText value="412750000" compact />}
        delta={{ value: "-3.1%", trend: "down", intent: "positive", label: "vs last month" }}
        sparkline={[480, 470, 455, 460, 440, 430, 425, 418, 412]}
      />
      <KpiCard
        label="Overdue amount"
        value={<MoneyText value="18400000" compact />}
        delta={{ value: "+₦6.2M", trend: "up", intent: "negative", label: "vs last month" }}
      />
      <KpiCard label="Active deals" value="17" sub="4 awaiting financier decision" />
    </div>
  );
}
