"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { LockKeyholeIcon, LockOpenIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setPeriodLock } from "@/features/accounting/actions";
import type { PeriodRow } from "@/features/accounting/queries";
import type { SavedView } from "@/features/saved-views/schemas";

export function PeriodsWorkspace({
  periods,
  savedViews,
}: {
  periods: PeriodRow[];
  savedViews: SavedView[];
}) {
  const columns: ColumnDef<PeriodRow>[] = [
    {
      accessorKey: "period",
      meta: { label: "Period" },
      header: "Period",
      cell: ({ row }) => <span className="num font-medium">{row.original.period}</span>,
    },
    {
      accessorKey: "is_locked",
      meta: { label: "Status" },
      header: "Status",
      cell: ({ row }) =>
        row.original.is_locked ? (
          <Badge variant="warning">
            <LockKeyholeIcon /> Locked
          </Badge>
        ) : (
          <Badge variant="success">
            <LockOpenIcon /> Open
          </Badge>
        ),
    },
    {
      accessorKey: "entry_count",
      meta: { label: "Entries", align: "right" },
      header: "Entries",
      cell: ({ row }) => <span className="num">{row.original.entry_count}</span>,
    },
    {
      accessorKey: "posted_count",
      meta: { label: "Posted", align: "right" },
      header: "Posted",
      cell: ({ row }) => <span className="num">{row.original.posted_count}</span>,
    },
    {
      id: "action",
      meta: { label: "Action", noExport: true },
      enableSorting: false,
      header: "Action",
      cell: ({ row }) => (
        <PeriodLockButton period={row.original.period} locked={row.original.is_locked} />
      ),
    },
  ];
  return (
    <DataTable
      tableKey="periods"
      label="Accounting periods"
      columns={columns}
      data={periods}
      getRowId={(row) => row.period}
      searchText={(row) => row.period}
      searchPlaceholder="Search month…"
      savedViews={savedViews}
      exportName="accounting-periods"
      initialSorting={[{ id: "period", desc: true }]}
      emptyState={
        <EmptyState
          icon={<LockKeyholeIcon />}
          title="No periods"
          description="Periods appear as journals are posted or as the current year is opened."
        />
      }
    />
  );
}

function PeriodLockButton({ period, locked }: { period: string; locked: boolean }) {
  const [pending, startTransition] = useTransition();
  function toggle() {
    startTransition(async () => {
      const result = await setPeriodLock({ period, locked: !locked });
      if (result.ok) toast.success(locked ? `${period} reopened` : `${period} locked`);
      else toast.error(result.error);
    });
  }
  return (
    <Button size="sm" variant={locked ? "outline" : "secondary"} pending={pending} onClick={toggle}>
      {locked ? (
        <>
          <LockOpenIcon /> Reopen
        </>
      ) : (
        <>
          <LockKeyholeIcon /> Lock period
        </>
      )}
    </Button>
  );
}
