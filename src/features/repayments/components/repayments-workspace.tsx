"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { FileCheck2Icon, FileUpIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";

import { DateText } from "@/components/common/date-text";
import { EmptyState } from "@/components/common/empty-state";
import { OpenPrivateFileButton } from "@/components/common/open-private-file-button";
import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { MoneyText } from "@/components/common/money-text";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  confirmRepayment,
  getRepaymentProofSignedFileUrl,
  reportRepayment,
} from "@/features/repayments/actions";
import {
  REPAYMENT_PROOF_ACCEPT,
  removeRepaymentProof,
  uploadRepaymentProof,
} from "@/features/repayments/proof-upload";
import type {
  RepaymentDealOption,
  RepaymentReportRow,
  RepaymentScheduleRow,
  RepaymentsPageData,
} from "@/features/repayments/queries";
import {
  repaymentChannelLabel,
  repaymentReportSchema,
  confirmRepaymentSchema,
  type RepaymentTab,
  type RepaymentReportInput,
} from "@/features/repayments/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";
import { lagosToday } from "@/lib/validation";

export function RepaymentsWorkspace({
  data,
  savedViews,
}: {
  data: RepaymentsPageData;
  savedViews: import("@/features/saved-views/schemas").SavedView[];
}) {
  const [tab, setTab] = useState<RepaymentTab>("due");
  const due = data.schedules.filter(
    (row) => row.status === "due" || row.status === "partially_paid",
  );
  const overdue = data.schedules.filter((row) => row.status === "overdue");
  const reported = data.reports.filter((row) => !row.confirmed_by_financier);
  const confirmed = data.schedules.filter((row) => row.status === "confirmed");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(value) => setTab(value as RepaymentTab)}>
          <TabsList className="max-w-full overflow-x-auto">
            <TabsTrigger value="due">
              Due soon <span className="num text-muted-foreground">{due.length}</span>
            </TabsTrigger>
            <TabsTrigger value="overdue">
              Overdue <span className="num text-muted-foreground">{overdue.length}</span>
            </TabsTrigger>
            <TabsTrigger value="reported">
              Reported <span className="num text-muted-foreground">{reported.length}</span>
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Confirmed <span className="num text-muted-foreground">{confirmed.length}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <RecordPaymentSheet deals={data.dealOptions} />
      </div>
      {tab === "reported" ? (
        <ReportedTable rows={reported} savedViews={savedViews} />
      ) : (
        <ScheduleTable
          tab={tab}
          rows={tab === "due" ? due : tab === "overdue" ? overdue : confirmed}
          savedViews={savedViews}
        />
      )}
    </div>
  );
}

function ScheduleTable({
  tab,
  rows,
  savedViews,
}: {
  tab: RepaymentTab;
  rows: RepaymentScheduleRow[];
  savedViews: import("@/features/saved-views/schemas").SavedView[];
}) {
  const columns: ColumnDef<RepaymentScheduleRow>[] = [
    {
      accessorKey: "reference",
      meta: { label: "Deal" },
      header: "Deal",
      cell: ({ row }) => (
        <Link
          href={`/deals/${row.original.deal_id}`}
          className="font-medium text-accent-ink hover:underline"
        >
          {row.original.reference}
        </Link>
      ),
    },
    {
      accessorKey: "client_name",
      meta: { label: "Client", className: "max-w-52 truncate" },
      header: "Client",
    },
    {
      accessorKey: "instalment_no",
      meta: { label: "Instalment" },
      header: "Instalment",
      cell: ({ row }) => <span className="num">#{row.original.instalment_no}</span>,
    },
    {
      accessorKey: "due_date",
      meta: { label: "Due" },
      header: "Due",
      cell: ({ row }) => (
        <span>
          <DateText value={row.original.due_date} />
          {row.original.days_overdue > 0 && (
            <span className="ml-2 text-danger">{row.original.days_overdue}d late</span>
          )}
        </span>
      ),
    },
    {
      id: "total_due",
      accessorFn: (row) => Number(row.total_due),
      meta: { label: "Amount", align: "right", exportValue: (row) => row.total_due },
      header: "Amount",
      cell: ({ row }) => <MoneyText value={row.original.total_due} />,
    },
    {
      id: "paid_total",
      accessorFn: (row) => Number(row.paid_total),
      meta: { label: "Paid", align: "right", exportValue: (row) => row.paid_total },
      header: "Paid",
      cell: ({ row }) => <MoneyText value={row.original.paid_total} />,
    },
    {
      id: "outstanding",
      accessorFn: (row) => Number(row.outstanding),
      meta: { label: "Balance", align: "right", exportValue: (row) => row.outstanding },
      header: "Balance",
      cell: ({ row }) => <MoneyText value={row.original.outstanding} />,
    },
    {
      accessorKey: "status",
      meta: { label: "Status" },
      header: "Status",
      cell: ({ row }) => <StatusBadge status={repaymentStatus(row.original.status)} />,
    },
    {
      accessorKey: "report_count",
      meta: { label: "Reports", align: "right" },
      header: "Reports",
      cell: ({ row }) => (
        <span className="num text-muted-foreground">{row.original.report_count}</span>
      ),
    },
  ];
  return (
    <DataTable
      tableKey={`repayments-${tab}`}
      label={`${tab} repayments`}
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      searchText={(row) =>
        [row.reference, row.client_name, row.financier_name ?? "", String(row.instalment_no)].join(
          " ",
        )
      }
      searchPlaceholder="Search deal or client…"
      savedViews={savedViews}
      rowHref={(row) => `/deals/${row.deal_id}`}
      exportName={`repayments-${tab}`}
      initialSorting={[{ id: "due_date", desc: false }]}
      emptyState={
        <EmptyState
          icon={<SearchIcon />}
          title={`No ${tab === "due" ? "due soon" : tab} repayments`}
          description={
            tab === "due"
              ? "Upcoming instalments will appear here."
              : "Nothing matches this repayment status."
          }
        />
      }
    />
  );
}

function ReportedTable({
  rows,
  savedViews,
}: {
  rows: RepaymentReportRow[];
  savedViews: import("@/features/saved-views/schemas").SavedView[];
}) {
  const columns: ColumnDef<RepaymentReportRow>[] = [
    {
      accessorKey: "reference",
      meta: { label: "Deal" },
      header: "Deal",
      cell: ({ row }) => (
        <Link
          href={`/deals/${row.original.deal_id}`}
          className="font-medium text-accent-ink hover:underline"
        >
          {row.original.reference}
        </Link>
      ),
    },
    {
      accessorKey: "client_name",
      meta: { label: "Client", className: "max-w-52 truncate" },
      header: "Client",
    },
    {
      accessorKey: "instalment_no",
      meta: { label: "Instalment" },
      header: "Instalment",
      cell: ({ row }) => <span className="num">#{row.original.instalment_no}</span>,
    },
    {
      id: "amount",
      accessorFn: (row) => Number(row.amount),
      meta: { label: "Reported", align: "right", exportValue: (row) => row.amount },
      header: "Reported",
      cell: ({ row }) => <MoneyText value={row.original.amount} />,
    },
    {
      accessorKey: "paid_on",
      meta: { label: "Paid on" },
      header: "Paid on",
      cell: ({ row }) => <DateText value={row.original.paid_on} />,
    },
    {
      accessorKey: "channel",
      meta: { label: "Channel" },
      header: "Channel",
      cell: ({ row }) => repaymentChannelLabel[row.original.channel],
    },
    {
      id: "proof",
      meta: { label: "Proof" },
      enableSorting: false,
      header: "Proof",
      cell: ({ row }) =>
        row.original.proof_file_path ? (
          <div className="flex items-center gap-2">
            <Badge variant="success">
              <FileCheck2Icon /> Attached
            </Badge>
            <OpenPrivateFileButton
              action={getRepaymentProofSignedFileUrl}
              input={row.original.id}
            />
          </div>
        ) : (
          <Badge variant="warning">Missing</Badge>
        ),
    },
    {
      id: "action",
      meta: { label: "Action", noExport: true },
      enableSorting: false,
      header: "Action",
      cell: ({ row }) => <ConfirmPaymentSheet report={row.original} />,
    },
  ];
  return (
    <DataTable
      tableKey="repayments-reported"
      label="Reported repayments"
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      searchText={(row) =>
        [row.reference, row.client_name, repaymentChannelLabel[row.channel]].join(" ")
      }
      searchPlaceholder="Search deal or client…"
      savedViews={savedViews}
      rowHref={(row) => `/deals/${row.deal_id}`}
      exportName="repayments-reported"
      initialSorting={[{ id: "reported_at", desc: true }]}
      emptyState={
        <EmptyState
          icon={<FileCheck2Icon />}
          title="No reported repayments"
          description="Payments waiting for financier confirmation will appear here."
        />
      }
    />
  );
}

function RecordPaymentSheet({ deals }: { deals: RepaymentDealOption[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proof, setProof] = useState<File | null>(null);
  const form = useForm<RepaymentReportInput>({
    resolver: zodResolver(
      repaymentReportSchema as never,
    ) as unknown as Resolver<RepaymentReportInput>,
    defaultValues: {
      deal_id: "",
      amount: "",
      paid_on: lagosToday(),
      channel: "receipt",
      proof_file_path: "",
    },
    mode: "onTouched",
  });
  const { errors } = form.formState;
  async function submit(values: RepaymentReportInput) {
    if (!proof) {
      setProofError("Upload proof of payment.");
      return;
    }
    setPending(true);
    setFormError(null);
    setProofError(null);
    const uploaded = await uploadRepaymentProof(values.deal_id, proof);
    if (!uploaded.ok) {
      setPending(false);
      setProofError(uploaded.error);
      return;
    }
    const result = await reportRepayment({ ...values, proof_file_path: uploaded.path });
    if (!result.ok) {
      await removeRepaymentProof(uploaded.path);
      setPending(false);
      setFormError(result.error);
      return;
    }
    setPending(false);
    setOpen(false);
    setProof(null);
    form.reset({
      deal_id: "",
      amount: "",
      paid_on: lagosToday(),
      channel: "receipt",
      proof_file_path: "",
    });
    toast.success("Repayment reported");
  }
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.handleSubmit(submit)(event);
  }
  return (
    <FormSheet
      open={open}
      onOpenChange={(next) => !pending && setOpen(next)}
      trigger={
        <Button disabled={deals.length === 0}>
          <FileUpIcon /> Record reported payment
        </Button>
      }
      title="Record reported payment"
      description="Upload the client proof. The payment is allocated oldest-instalment-first, including partial balances."
      submitLabel="Record payment"
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field
        label="Deal"
        htmlFor="repayment-deal"
        required
        error={typeof errors.deal_id?.message === "string" ? errors.deal_id.message : undefined}
      >
        <Controller
          control={form.control}
          name="deal_id"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="repayment-deal" className="w-full">
                <SelectValue placeholder="Choose a deal" />
              </SelectTrigger>
              <SelectContent>
                {deals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id}>
                    {deal.reference} · {deal.client_name} · {deal.outstanding}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field
        label="Payment amount"
        htmlFor="repayment-amount"
        required
        error={typeof errors.amount?.message === "string" ? errors.amount.message : undefined}
      >
        <Input
          id="repayment-amount"
          inputMode="decimal"
          className="num"
          {...form.register("amount")}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Paid on"
          htmlFor="repayment-paid-on"
          required
          error={typeof errors.paid_on?.message === "string" ? errors.paid_on.message : undefined}
        >
          <Input id="repayment-paid-on" type="date" {...form.register("paid_on")} />
        </Field>
        <Field
          label="Channel"
          htmlFor="repayment-channel"
          required
          error={typeof errors.channel?.message === "string" ? errors.channel.message : undefined}
        >
          <Controller
            control={form.control}
            name="channel"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="repayment-channel" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(repaymentChannelLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>
      <Field
        label="Proof of payment"
        htmlFor="repayment-proof"
        required
        error={proofError ?? undefined}
      >
        <input
          ref={input}
          id="repayment-proof"
          type="file"
          accept={REPAYMENT_PROOF_ACCEPT}
          className="sr-only"
          onChange={(event) => {
            setProof(event.target.files?.[0] ?? null);
            setProofError(null);
            event.target.value = "";
          }}
        />
        <Button type="button" variant="outline" onClick={() => input.current?.click()}>
          <FileUpIcon /> {proof ? "Replace proof" : "Upload proof"}
        </Button>
        {proof && <p className="mt-1.5 text-small text-muted-foreground">{proof.name}</p>}
      </Field>
    </FormSheet>
  );
}

function ConfirmPaymentSheet({ report }: { report: RepaymentReportRow }) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: confirmRepaymentSchema,
    defaultValues: { confirmed_at: lagosToday(), confirmation_note: "" },
    action: (values) => confirmRepayment(report.id, values),
    successMessage: "Repayment confirmed with financier",
  });
  const { errors } = form.formState;
  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={<Button size="sm">Confirm with financier</Button>}
      title="Confirm repayment"
      description={`${report.reference} · instalment #${report.instalment_no} · ${report.amount}`}
      submitLabel="Confirm repayment"
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field
        label="Confirmation date"
        htmlFor={`confirm-date-${report.id}`}
        required
        error={
          typeof errors.confirmed_at?.message === "string" ? errors.confirmed_at.message : undefined
        }
      >
        <Input id={`confirm-date-${report.id}`} type="date" {...form.register("confirmed_at")} />
      </Field>
      <Field
        label="Note"
        htmlFor={`confirm-note-${report.id}`}
        error={
          typeof errors.confirmation_note?.message === "string"
            ? errors.confirmation_note.message
            : undefined
        }
      >
        <Textarea
          id={`confirm-note-${report.id}`}
          rows={4}
          placeholder="e.g. Financier confirmed by email"
          {...form.register("confirmation_note")}
        />
      </Field>
    </FormSheet>
  );
}

function repaymentStatus(status: RepaymentScheduleRow["status"]) {
  if (status === "overdue") return { label: "Overdue", tone: "danger" as const };
  if (status === "reported") return { label: "Reported", tone: "info" as const };
  if (status === "confirmed") return { label: "Confirmed", tone: "success" as const };
  if (status === "partially_paid") return { label: "Partially paid", tone: "warning" as const };
  if (status === "due") return { label: "Due soon", tone: "warning" as const };
  return { label: "Scheduled", tone: "neutral" as const };
}

