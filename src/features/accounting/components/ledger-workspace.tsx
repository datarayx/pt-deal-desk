"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BookOpenIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { DateText } from "@/components/common/date-text";
import { EmptyState } from "@/components/common/empty-state";
import { MoneyText } from "@/components/common/money-text";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LedgerRow } from "@/features/accounting/queries";
import type { SavedView } from "@/features/saved-views/schemas";

export function LedgerWorkspace({
  rows,
  savedViews,
}: {
  rows: LedgerRow[];
  savedViews: SavedView[];
}) {
  const [account, setAccount] = useState("all");
  const [period, setPeriod] = useState("all");
  const accounts = useMemo(
    () =>
      [
        ...new Map(
          rows.map((row) => [row.account_id, `${row.account_code} · ${row.account_name}`]),
        ).entries(),
      ].sort((a, b) => a[1].localeCompare(b[1])),
    [rows],
  );
  const periods = useMemo(
    () => [...new Set(rows.map((row) => row.period))].sort().reverse(),
    [rows],
  );
  const filteredRows = rows.filter(
    (row) =>
      (account === "all" || row.account_id === account) &&
      (period === "all" || row.period === period),
  );
  const columns: ColumnDef<LedgerRow>[] = [
    {
      accessorKey: "entry_date",
      meta: { label: "Date" },
      header: "Date",
      cell: ({ row }) => <DateText value={row.original.entry_date} />,
    },
    {
      accessorKey: "account_code",
      meta: { label: "Account" },
      header: "Account",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.account_code} · {row.original.account_name}
        </span>
      ),
    },
    {
      accessorKey: "reference",
      meta: { label: "Reference" },
      header: "Reference",
      cell: ({ row }) => row.original.reference ?? <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "memo",
      meta: { label: "Memo", className: "max-w-72 truncate" },
      header: "Memo",
      cell: ({ row }) => <span className="max-w-72 truncate">{row.original.memo ?? "—"}</span>,
    },
    {
      id: "debit",
      accessorFn: (row) => Number(row.debit),
      meta: { label: "Debit", align: "right", exportValue: (row) => row.debit },
      header: "Debit",
      cell: ({ row }) => <MoneyText value={row.original.debit} />,
    },
    {
      id: "credit",
      accessorFn: (row) => Number(row.credit),
      meta: { label: "Credit", align: "right", exportValue: (row) => row.credit },
      header: "Credit",
      cell: ({ row }) => <MoneyText value={row.original.credit} />,
    },
    {
      id: "running_balance",
      accessorFn: (row) => Number(row.running_balance),
      meta: { label: "Running balance", align: "right", exportValue: (row) => row.running_balance },
      header: "Running balance",
      cell: ({ row }) => <MoneyText value={row.original.running_balance} />,
    },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-64">
          <label className="mb-1.5 block text-small font-medium" htmlFor="ledger-account">
            Account
          </label>
          <Select value={account} onValueChange={setAccount}>
            <SelectTrigger id="ledger-account">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accounts.map(([id, label]) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-40">
          <label className="mb-1.5 block text-small font-medium" htmlFor="ledger-period">
            Period
          </label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger id="ledger-period">
              <SelectValue placeholder="All periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All periods</SelectItem>
              {periods.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(account !== "all" || period !== "all") && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setAccount("all");
              setPeriod("all");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
      <DataTable
        tableKey="ledger"
        label="General ledger"
        columns={columns}
        data={filteredRows}
        getRowId={(row) => row.id}
        searchText={(row) =>
          [
            row.account_code,
            row.account_name,
            row.reference ?? "",
            row.memo ?? "",
            row.period,
          ].join(" ")
        }
        searchPlaceholder="Search account, reference or memo…"
        savedViews={savedViews}
        exportName="general-ledger"
        initialSorting={[{ id: "entry_date", desc: false }]}
        emptyState={
          <EmptyState
            icon={<BookOpenIcon />}
            title="No posted ledger movements"
            description="Posted journal lines will appear here with an account running balance."
          />
        }
      />
    </div>
  );
}

