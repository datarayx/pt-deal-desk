"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BookOpenIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useFieldArray } from "react-hook-form";

import { DateText } from "@/components/common/date-text";
import { EmptyState } from "@/components/common/empty-state";
import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { MoneyText } from "@/components/common/money-text";
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
import { Textarea } from "@/components/ui/textarea";
import {
  journalBalance,
  journalValidationError,
  type JournalLineInput,
} from "@/features/accounting/logic";
import { postManualJournal } from "@/features/accounting/actions";
import type { AccountRow, JournalRow } from "@/features/accounting/queries";
import { journalSchema } from "@/features/accounting/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";
import { lagosToday } from "@/lib/validation";
import type { SavedView } from "@/features/saved-views/schemas";

export function JournalsWorkspace({
  journals,
  accounts,
  savedViews,
}: {
  journals: JournalRow[];
  accounts: AccountRow[];
  savedViews: SavedView[];
}) {
  const columns: ColumnDef<JournalRow>[] = [
    {
      accessorKey: "entry_date",
      meta: { label: "Date" },
      header: "Date",
      cell: ({ row }) => <DateText value={row.original.entry_date} />,
    },
    {
      accessorKey: "reference",
      meta: { label: "Reference" },
      header: "Reference",
      cell: ({ row }) => row.original.reference ?? <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "memo",
      meta: { label: "Memo", className: "max-w-80 truncate" },
      header: "Memo",
      cell: ({ row }) => <span className="max-w-80 truncate">{row.original.memo}</span>,
    },
    {
      accessorKey: "source",
      meta: { label: "Source" },
      header: "Source",
      cell: ({ row }) => (
        <Badge variant={row.original.source === "manual" ? "outline" : "accent"}>
          {row.original.source}
        </Badge>
      ),
    },
    {
      id: "debit_total",
      accessorFn: (row) => Number(row.debit_total),
      meta: { label: "Debit", align: "right", exportValue: (row) => row.debit_total },
      header: "Debit",
      cell: ({ row }) => <MoneyText value={row.original.debit_total} />,
    },
    {
      id: "credit_total",
      accessorFn: (row) => Number(row.credit_total),
      meta: { label: "Credit", align: "right", exportValue: (row) => row.credit_total },
      header: "Credit",
      cell: ({ row }) => <MoneyText value={row.original.credit_total} />,
    },
    {
      id: "lines",
      meta: { label: "Lines", align: "right" },
      header: "Lines",
      cell: ({ row }) => (
        <span className="num text-muted-foreground">{row.original.lines.length}</span>
      ),
    },
  ];
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <ManualJournalSheet accounts={accounts.filter((account) => account.is_active)} />
      </div>
      <DataTable
        tableKey="journals"
        label="Journal entries"
        columns={columns}
        data={journals}
        getRowId={(row) => row.id}
        searchText={(row) =>
          [row.reference ?? "", row.memo ?? "", row.source, row.period].join(" ")
        }
        searchPlaceholder="Search reference, memo or period…"
        savedViews={savedViews}
        exportName="journals"
        initialSorting={[{ id: "entry_date", desc: true }]}
        emptyState={
          <EmptyState
            icon={<BookOpenIcon />}
            title="No journal entries yet"
            description="Post a balanced manual journal or let a system trigger create one."
          />
        }
      />
    </div>
  );
}

function ManualJournalSheet({ accounts }: { accounts: AccountRow[] }) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: journalSchema,
    defaultValues: {
      entry_date: lagosToday(),
      reference: "",
      memo: "",
      lines: [
        { account: "", debit: "", credit: "", description: "" },
        { account: "", debit: "", credit: "", description: "" },
      ],
    },
    action: postManualJournal,
    successMessage: "Journal posted",
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const lines = form.watch("lines") as JournalLineInput[];
  const balance = journalBalance(lines);
  const validationError = journalValidationError(lines);
  const lineError = form.formState.errors.lines as { message?: string } | undefined;
  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button>
          <PlusIcon /> New manual journal
        </Button>
      }
      title="New manual journal"
      description="Every line must be one-sided and total debits must equal total credits before posting."
      submitLabel="Post journal"
      pending={pending}
      submitDisabled={!balance.balanced}
      formError={formError}
      onSubmit={onSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Entry date"
          htmlFor="journal-date"
          required
          error={form.formState.errors.entry_date?.message}
        >
          <Input id="journal-date" type="date" {...form.register("entry_date")} />
        </Field>
        <Field
          label="Reference"
          htmlFor="journal-reference"
          error={form.formState.errors.reference?.message}
        >
          <Input
            id="journal-reference"
            placeholder="e.g. JV-2026-001"
            {...form.register("reference")}
          />
        </Field>
      </div>
      <Field
        label="Memo"
        htmlFor="journal-memo"
        required
        error={form.formState.errors.memo?.message}
      >
        <Textarea
          id="journal-memo"
          rows={3}
          placeholder="What is this journal for?"
          {...form.register("memo")}
        />
      </Field>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-small font-semibold">Lines</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ account: "", debit: "", credit: "", description: "" })}
          >
            <PlusIcon /> Add line
          </Button>
        </div>
        {fields.map((field, index) => {
          const errors = form.formState.errors.lines?.[index] as
            | {
                account?: { message?: string };
                debit?: { message?: string };
                credit?: { message?: string };
                description?: { message?: string };
              }
            | undefined;
          return (
            <div
              key={field.id}
              className="rounded-lg border border-border bg-surface-subtle/40 p-3"
            >
              <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr_auto]">
                <Field
                  label="Account"
                  htmlFor={`journal-account-${index}`}
                  required
                  error={errors?.account?.message}
                >
                  <Select
                    value={form.watch(`lines.${index}.account`) || ""}
                    onValueChange={(value) =>
                      form.setValue(`lines.${index}.account`, value, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger id={`journal-account-${index}`} className="w-full">
                      <SelectValue placeholder="Choose account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.code}>
                          {account.code} · {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  label="Debit"
                  htmlFor={`journal-debit-${index}`}
                  error={errors?.debit?.message}
                >
                  <Input
                    id={`journal-debit-${index}`}
                    inputMode="decimal"
                    className="num"
                    {...form.register(`lines.${index}.debit`)}
                  />
                </Field>
                <Field
                  label="Credit"
                  htmlFor={`journal-credit-${index}`}
                  error={errors?.credit?.message}
                >
                  <Input
                    id={`journal-credit-${index}`}
                    inputMode="decimal"
                    className="num"
                    {...form.register(`lines.${index}.credit`)}
                  />
                </Field>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove line ${index + 1}`}
                    disabled={fields.length <= 2}
                    onClick={() => remove(index)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </div>
              <Field
                label="Description"
                htmlFor={`journal-description-${index}`}
                error={errors?.description?.message}
              >
                <Input
                  id={`journal-description-${index}`}
                  placeholder="Optional line description"
                  {...form.register(`lines.${index}.description`)}
                />
              </Field>
            </div>
          );
        })}
        {(lineError?.message || validationError) && (
          <p className="text-small text-danger" role="alert">
            {lineError?.message ?? validationError}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface-subtle px-3 py-3 text-small">
        <div>
          <span className="text-muted-foreground">Debits</span>
          <MoneyText value={balance.debit} />
        </div>
        <div>
          <span className="text-muted-foreground">Credits</span>
          <MoneyText value={balance.credit} />
        </div>
      </div>
    </FormSheet>
  );
}
