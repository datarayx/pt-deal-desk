"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2Icon, PhoneCallIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DateText } from "@/components/common/date-text";
import { EmptyState } from "@/components/common/empty-state";
import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logFollowUpCall } from "@/features/follow-ups/actions";
import type { FollowUpRow } from "@/features/follow-ups/queries";
import { callLogSchema } from "@/features/follow-ups/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";

export function FollowUpsWorkspace({
  tasks,
  savedViews,
}: {
  tasks: FollowUpRow[];
  savedViews: import("@/features/saved-views/schemas").SavedView[];
}) {
  const [tab, setTab] = useState<"open" | "done">("open");
  const rows = tasks.filter((task) => task.status === tab);
  const columns: ColumnDef<FollowUpRow>[] = [
    {
      accessorKey: "client_name",
      meta: { label: "Client", className: "max-w-52 truncate" },
      header: "Client",
    },
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
      accessorKey: "due_date",
      meta: { label: "Due" },
      header: "Due",
      cell: ({ row }) => <DateText value={row.original.due_date} />,
    },
    {
      accessorKey: "assigned_name",
      meta: { label: "Assigned" },
      header: "Assigned",
      cell: ({ row }) =>
        row.original.assigned_name ?? <span className="text-muted-foreground">Unassigned</span>,
    },
    {
      accessorKey: "outcome",
      meta: { label: "Outcome", className: "max-w-72 whitespace-normal" },
      header: "Outcome",
      cell: ({ row }) =>
        row.original.outcome ?? <span className="text-muted-foreground">Open call</span>,
    },
    {
      accessorKey: "promise_to_pay_date",
      meta: { label: "Promise to pay" },
      header: "Promise to pay",
      cell: ({ row }) => <DateText value={row.original.promise_to_pay_date} />,
    },
    {
      id: "action",
      meta: { label: "Action", noExport: true },
      enableSorting: false,
      header: "Action",
      cell: ({ row }) =>
        row.original.status === "open" ? (
          <CallLogSheet task={row.original} />
        ) : (
          <span className="inline-flex items-center gap-1 text-small text-success">
            <CheckCircle2Icon className="size-4" /> Done
          </span>
        ),
    },
  ];
  return (
    <div className="space-y-5">
      <Tabs value={tab} onValueChange={(value) => setTab(value as "open" | "done")}>
        <TabsList>
          <TabsTrigger value="open">
            Open{" "}
            <span className="num text-muted-foreground">
              {tasks.filter((task) => task.status === "open").length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="done">
            Completed{" "}
            <span className="num text-muted-foreground">
              {tasks.filter((task) => task.status === "done").length}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <DataTable
        tableKey="follow-ups"
        label={`${tab} follow-up calls`}
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        searchText={(row) =>
          [row.client_name, row.reference, row.assigned_name ?? "", row.outcome ?? ""].join(" ")
        }
        searchPlaceholder="Search client, deal or outcome…"
        savedViews={savedViews}
        rowHref={(row) => `/deals/${row.deal_id}`}
        exportName="follow-ups"
        initialSorting={[{ id: "due_date", desc: false }]}
        emptyState={
          <EmptyState
            icon={<SearchIcon />}
            title={tab === "open" ? "No open call tasks" : "No completed calls"}
            description={
              tab === "open"
                ? "Overdue instalments will create call tasks for follow-up."
                : "Completed call logs will appear here."
            }
          />
        }
      />
    </div>
  );
}

function CallLogSheet({ task }: { task: FollowUpRow }) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: callLogSchema,
    defaultValues: { outcome: "", promise_to_pay_date: "" },
    action: (values) => logFollowUpCall(task.id, values),
    successMessage: "Call logged",
  });
  const { errors } = form.formState;
  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="sm" variant="outline">
          <PhoneCallIcon /> Log call
        </Button>
      }
      title="Log call"
      description={`${task.client_name} · ${task.reference}`}
      submitLabel="Save call outcome"
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field
        label="Outcome"
        htmlFor={`call-outcome-${task.id}`}
        required
        error={typeof errors.outcome?.message === "string" ? errors.outcome.message : undefined}
      >
        <Input
          id={`call-outcome-${task.id}`}
          autoFocus
          placeholder="e.g. Client promised payment after invoice clears"
          {...form.register("outcome")}
        />
      </Field>
      <Field
        label="Promise-to-pay date"
        htmlFor={`call-promise-${task.id}`}
        error={
          typeof errors.promise_to_pay_date?.message === "string"
            ? errors.promise_to_pay_date.message
            : undefined
        }
      >
        <Input
          id={`call-promise-${task.id}`}
          type="date"
          {...form.register("promise_to_pay_date")}
        />
      </Field>
    </FormSheet>
  );
}
