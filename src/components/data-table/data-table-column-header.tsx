"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Sortable header: click cycles ascending → descending → off. */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: {
  column: Column<TData, TValue>;
  title: string;
}) {
  const right = column.columnDef.meta?.align === "right";
  if (!column.getCanSort()) {
    return <span className={cn("block", right && "text-right")}>{title}</span>;
  }
  const sorted = column.getIsSorted();
  const Icon =
    sorted === "asc" ? ArrowUpIcon : sorted === "desc" ? ArrowDownIcon : ChevronsUpDownIcon;
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "-mx-1.5 inline-flex h-7 items-center gap-1 rounded-md px-1.5 transition-colors hover:bg-surface-subtle hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        right && "float-right flex-row-reverse",
        sorted && "text-foreground",
      )}
      aria-label={`Sort by ${title}${sorted === "asc" ? ", sorted ascending" : sorted === "desc" ? ", sorted descending" : ""}`}
    >
      {title}
      <Icon className={cn("size-3.5", !sorted && "opacity-50")} aria-hidden />
    </button>
  );
}
