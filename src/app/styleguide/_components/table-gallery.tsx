import { DateText } from "@/components/common/date-text";
import { MoneyText } from "@/components/common/money-text";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { repaymentStatus, type StatusPreset } from "@/lib/status";

type Row = {
  ref: string;
  client: string;
  financier: string;
  due: string;
  amount: string;
  status: StatusPreset;
  detail?: string;
};

const rows: Row[] = [
  {
    ref: "PT-2026-0031",
    client: "Zuma Rock Minerals Ltd",
    financier: "Crestline Finance House",
    due: "2026-11-25",
    amount: "14250000.00",
    status: repaymentStatus.due,
    detail: "in 2 days",
  },
  {
    ref: "PT-2026-0027",
    client: "Okeke Agro Processing Ltd",
    financier: "Harbourgate Capital",
    due: "2026-11-18",
    amount: "6800000.00",
    status: repaymentStatus.overdue,
    detail: "5 days",
  },
  {
    ref: "PT-2026-0019",
    client: "Bello & Sons Logistics",
    financier: "Savanna Credit Ltd",
    due: "2026-11-15",
    amount: "22500000.00",
    status: repaymentStatus.reported,
  },
  {
    ref: "PT-2026-0012",
    client: "Adaeze Okafor",
    financier: "Meridian Asset Finance",
    due: "2026-11-10",
    amount: "3125000.50",
    status: repaymentStatus.confirmed,
  },
];

export function TableGallery() {
  return (
    <Card className="mt-4 gap-0 pb-0">
      <CardHeader className="border-b pb-4">
        <CardTitle>Upcoming repayments</CardTitle>
        <CardDescription>Instalments due or awaiting confirmation</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            View all
          </Button>
        </CardAction>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deal</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Financier</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.ref}>
              <TableCell className="num font-medium text-accent-ink">{row.ref}</TableCell>
              <TableCell className="max-w-48 truncate">{row.client}</TableCell>
              <TableCell className="text-muted-foreground">{row.financier}</TableCell>
              <TableCell>
                <DateText value={row.due} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyText value={row.amount} />
              </TableCell>
              <TableCell>
                <StatusBadge status={row.status} detail={row.detail} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>Total</TableCell>
            <TableCell className="text-right">
              <MoneyText value="46675000.50" />
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  );
}
