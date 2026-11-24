"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BanknoteArrowDownIcon, ReceiptTextIcon } from "lucide-react";

import { DateText } from "@/components/common/date-text";
import { EmptyState } from "@/components/common/empty-state";
import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { MoneyText } from "@/components/common/money-text";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recordFeeReceipt } from "@/features/accounting/actions";
import type { FinanceFeeRow } from "@/features/accounting/finance-queries";
import { feeReceiptSchema } from "@/features/accounting/finance-schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";
import { lagosToday } from "@/lib/validation";
import type { SavedView } from "@/features/saved-views/schemas";

const feeKindLabel: Record<FinanceFeeRow["fee_kind"], string> = {
  provider_commission: "Provider commission",
  client_fee: "Client fee",
  collateral_fee: "Collateral fee",
  referral_fee: "Referral fee",
};

export function ReceivablesWorkspace({
  fees,
  savedViews,
}: {
  fees: FinanceFeeRow[];
  savedViews: SavedView[];
}) {
  const columns: ColumnDef<FinanceFeeRow>[] = [
    {
      accessorKey: "fee_kind",
      meta: { label: "Source" },
      header: "Source",
      cell: ({ row }) => feeKindLabel[row.original.fee_kind],
    },
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
      id: "amount_due",
      accessorFn: (row) => Number(row.amount_due),
      meta: { label: "Amount due", align: "right", exportValue: (row) => row.amount_due },
      header: "Amount due",
      cell: ({ row }) => <MoneyText value={row.original.amount_due} />,
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
            row.original.status === "received"
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
          <ReceiptSheet fee={row.original} />
        ) : (
          <span className="text-small text-muted-foreground">Settled</span>
        ),
    },
  ];
  return (
    <DataTable
      tableKey="fee-receivables"
      label="Fee receivables"
      columns={columns}
      data={fees}
      getRowId={(row) => row.fee_id}
      searchText={(row) =>
        [row.deal_reference, row.client_name, feeKindLabel[row.fee_kind], row.status].join(" ")
      }
      searchPlaceholder="Search deal, client or fee…"
      savedViews={savedViews}
      exportName="fee-receivables"
      initialSorting={[{ id: "earned_at", desc: true }]}
      emptyState={
        <EmptyState
          icon={<BanknoteArrowDownIcon />}
          title="No fee receivables"
          description="Fees recognised but not yet received will appear here."
        />
      }
    />
  );
}

function ReceiptSheet({ fee }: { fee: FinanceFeeRow }) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: feeReceiptSchema,
    defaultValues: { received_on: lagosToday(), wht_amount: "" },
    action: (values) => recordFeeReceipt(fee.fee_id, values),
    successMessage: "Fee receipt posted",
  });
  const { errors } = form.formState;
  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="sm">
          <ReceiptTextIcon /> Record receipt
        </Button>
      }
      title="Record fee receipt"
      description={`${fee.deal_reference} · ${fee.client_name} · ${feeKindLabel[fee.fee_kind]}`}
      submitLabel="Post receipt"
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field
        label="Received on"
        htmlFor={`receipt-date-${fee.fee_id}`}
        required
        error={errors.received_on?.message}
      >
        <Input id={`receipt-date-${fee.fee_id}`} type="date" {...form.register("received_on")} />
      </Field>
      <Field
        label="WHT deducted"
        htmlFor={`receipt-wht-${fee.fee_id}`}
        hint="Leave blank to use the configured WHT rate."
        error={errors.wht_amount?.message}
      >
        <Input
          id={`receipt-wht-${fee.fee_id}`}
          inputMode="decimal"
          className="num"
          placeholder="0.00"
          {...form.register("wht_amount")}
        />
      </Field>
    </FormSheet>
  );
}
