"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BanknoteArrowUpIcon, CreditCardIcon } from "lucide-react";

import { DateText } from "@/components/common/date-text";
import { EmptyState } from "@/components/common/empty-state";
import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { MoneyText } from "@/components/common/money-text";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { payReferralFee } from "@/features/accounting/actions";
import type { FinanceFeeRow } from "@/features/accounting/finance-queries";
import { referralPaymentSchema } from "@/features/accounting/finance-schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";
import { lagosToday } from "@/lib/validation";
import type { SavedView } from "@/features/saved-views/schemas";

export function PayablesWorkspace({
  fees,
  savedViews,
}: {
  fees: FinanceFeeRow[];
  savedViews: SavedView[];
}) {
  const columns: ColumnDef<FinanceFeeRow>[] = [
    {
      accessorKey: "deal_reference",
      meta: { label: "Deal" },
      header: "Deal",
      cell: ({ row }) => <span className="font-medium">{row.original.deal_reference}</span>,
    },
    {
      accessorKey: "client_name",
      meta: { label: "Client" },
      header: "Client",
      cell: ({ row }) => row.original.client_name,
    },
    {
      id: "amount",
      accessorFn: (row) => Number(row.computed_amount ?? "0"),
      meta: {
        label: "Amount payable",
        align: "right",
        exportValue: (row) => row.computed_amount ?? "0.00",
      },
      header: "Amount payable",
      cell: ({ row }) => <MoneyText value={row.original.computed_amount ?? "0.00"} />,
    },
    {
      accessorKey: "earned_at",
      meta: { label: "Earned" },
      header: "Earned",
      cell: ({ row }) => <DateText value={row.original.earned_at} withTime={false} />,
    },
    {
      accessorKey: "status",
      meta: { label: "Status" },
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "paid"
              ? "success"
              : row.original.status === "earned"
                ? "warning"
                : "outline"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "action",
      meta: { label: "Action", noExport: true },
      enableSorting: false,
      header: "Action",
      cell: ({ row }) =>
        row.original.status === "earned" ? (
          <PaymentSheet fee={row.original} />
        ) : (
          <span className="text-small text-muted-foreground">Settled</span>
        ),
    },
  ];
  return (
    <DataTable
      tableKey="payables"
      label="Referral payables"
      columns={columns}
      data={fees}
      getRowId={(row) => row.fee_id}
      searchText={(row) => [row.deal_reference, row.client_name, row.status].join(" ")}
      searchPlaceholder="Search deal, client or status…"
      savedViews={savedViews}
      exportName="payables"
      initialSorting={[{ id: "earned_at", desc: true }]}
      emptyState={
        <EmptyState
          icon={<BanknoteArrowUpIcon />}
          title="No referral payables"
          description="Referral fees recognised at disbursement will appear here."
        />
      }
    />
  );
}

function PaymentSheet({ fee }: { fee: FinanceFeeRow }) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: referralPaymentSchema,
    defaultValues: { paid_on: lagosToday() },
    action: (values) => payReferralFee(fee.fee_id, values),
    successMessage: "Referral payment posted",
  });
  const { errors } = form.formState;
  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="sm">
          <CreditCardIcon /> Record payment
        </Button>
      }
      title="Record referral payment"
      description={`${fee.deal_reference} · ${fee.client_name} · ${fee.computed_amount ?? "0.00"}`}
      submitLabel="Post payment"
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field
        label="Paid on"
        htmlFor={`payment-date-${fee.fee_id}`}
        required
        error={errors.paid_on?.message}
      >
        <Input id={`payment-date-${fee.fee_id}`} type="date" {...form.register("paid_on")} />
      </Field>
    </FormSheet>
  );
}
