import { MoneyText } from "@/components/common/money-text";
import { formatRate } from "@/lib/format/rate";

/** "1.5%" or "₦500,000.00" for a fee basis + value; "—" when there is none. */
export function FeeTerms({
  basis,
  value,
}: {
  basis: "percent" | "flat" | null;
  value: string | null;
}) {
  if (!basis || value === null) return <span className="text-muted-foreground">—</span>;
  if (basis === "percent") return <span className="num">{formatRate(value)}</span>;
  return <MoneyText value={value} />;
}

export function feeTermsText(basis: "percent" | "flat" | null, value: string | null): string {
  if (!basis || value === null) return "";
  // Flat fees are stored as numeric(18,4) but always entered with at most 2 decimals.
  return basis === "percent"
    ? (formatRate(value) ?? "")
    : `NGN ${value.replace(/^(\d+\.\d{2})\d*$/, "$1")}`;
}
