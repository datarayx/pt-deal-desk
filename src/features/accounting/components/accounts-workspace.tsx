"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BookOpenIcon, PencilIcon, PlusIcon } from "lucide-react";
import type * as React from "react";

import { EmptyState } from "@/components/common/empty-state";
import { FormSheet } from "@/components/common/form-sheet";
import { MoneyText } from "@/components/common/money-text";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/common/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveAccount } from "@/features/accounting/actions";
import type { AccountRow } from "@/features/accounting/queries";
import { accountSchema } from "@/features/accounting/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";
import type { SavedView } from "@/features/saved-views/schemas";

const typeLabel: Record<AccountRow["type"], string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  income: "Income",
  expense: "Expense",
};

export function AccountsWorkspace({
  accounts,
  savedViews,
}: {
  accounts: AccountRow[];
  savedViews: SavedView[];
}) {
  const columns: ColumnDef<AccountRow>[] = [
    {
      accessorKey: "code",
      meta: { label: "Code" },
      header: "Code",
      cell: ({ row }) => <span className="num font-medium">{row.original.code}</span>,
    },
    {
      accessorKey: "name",
      meta: { label: "Account" },
      header: "Account",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "type",
      meta: { label: "Type" },
      header: "Type",
      cell: ({ row }) => typeLabel[row.original.type],
    },
    {
      accessorKey: "subtype",
      meta: { label: "Subtype" },
      header: "Subtype",
      cell: ({ row }) => row.original.subtype ?? <span className="text-muted-foreground">—</span>,
    },
    {
      id: "balance",
      accessorFn: (row) => Number(row.balance),
      meta: { label: "Balance", align: "right", exportValue: (row) => row.balance },
      header: "Balance",
      cell: ({ row }) => <MoneyText value={row.original.balance} />,
    },
    {
      id: "status",
      meta: { label: "Status" },
      enableSorting: false,
      header: "Status",
      cell: ({ row }) =>
        row.original.is_system ? (
          <Badge variant="accent">System</Badge>
        ) : row.original.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="outline">Inactive</Badge>
        ),
    },
    {
      id: "action",
      meta: { label: "Action", noExport: true },
      enableSorting: false,
      header: "Action",
      cell: ({ row }) =>
        row.original.is_system ? (
          <span className="text-small text-muted-foreground">Locked</span>
        ) : (
          <AccountSheet account={row.original} accounts={accounts} />
        ),
    },
  ];

  return (
    <DataTable
      tableKey="accounts"
      label="Chart of accounts"
      columns={columns}
      data={accounts}
      getRowId={(row) => row.id}
      searchText={(row) => [row.code, row.name, row.type, row.subtype ?? ""].join(" ")}
      searchPlaceholder="Search account code or name…"
      savedViews={savedViews}
      exportName="chart-of-accounts"
      initialSorting={[{ id: "code", desc: false }]}
      emptyState={
        <EmptyState
          icon={<BookOpenIcon />}
          title="No accounts yet"
          description="Add the accounts your books use, or seed the demo chart first."
          action={
            <AccountSheet
              accounts={accounts}
              trigger={
                <Button>
                  <PlusIcon /> Add account
                </Button>
              }
            />
          }
        />
      }
    />
  );
}

function AccountSheet({
  account,
  accounts,
  trigger,
}: {
  account?: AccountRow;
  accounts: AccountRow[];
  trigger?: React.ReactNode;
}) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: accountSchema,
    defaultValues: {
      code: account?.code ?? "",
      name: account?.name ?? "",
      type: account?.type ?? "asset",
      subtype: account?.subtype ?? "",
      parent_id: account?.parent_id ?? "",
    },
    action: (values) => saveAccount(account?.id, values),
    successMessage: account ? "Account updated" : "Account added",
  });
  const { errors } = form.formState;
  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={
        trigger ?? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${account?.name}`}>
            <PencilIcon />
          </Button>
        )
      }
      title={account ? "Edit account" : "Add account"}
      description="System account codes and types are protected by the database."
      submitLabel={account ? "Save changes" : "Add account"}
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field label="Code" htmlFor="account-code" required error={errors.code?.message}>
        <Input
          id="account-code"
          inputMode="numeric"
          className="num"
          disabled={Boolean(account?.is_system)}
          {...form.register("code")}
        />
      </Field>
      <Field label="Account name" htmlFor="account-name" required error={errors.name?.message}>
        <Input id="account-name" {...form.register("name")} />
      </Field>
      <Field label="Type" htmlFor="account-type" required error={errors.type?.message}>
        <Select
          value={form.watch("type")}
          onValueChange={(value) =>
            form.setValue("type", value as AccountRow["type"], { shouldValidate: true })
          }
          disabled={Boolean(account?.is_system)}
        >
          <SelectTrigger id="account-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(typeLabel).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Subtype" htmlFor="account-subtype" error={errors.subtype?.message}>
        <Input
          id="account-subtype"
          placeholder="e.g. bank, revenue, tax"
          {...form.register("subtype")}
        />
      </Field>
      <Field label="Parent account" htmlFor="account-parent" error={errors.parent_id?.message}>
        <Select
          value={form.watch("parent_id") || "none"}
          onValueChange={(value) =>
            form.setValue("parent_id", value === "none" ? "" : value, { shouldValidate: true })
          }
        >
          <SelectTrigger id="account-parent" className="w-full">
            <SelectValue placeholder="No parent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No parent</SelectItem>
            {accounts
              .filter((item) => item.id !== account?.id)
              .map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.code} · {item.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </Field>
    </FormSheet>
  );
}
