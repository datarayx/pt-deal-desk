"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  DownloadIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  SearchIcon,
  SearchXIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import type * as React from "react";

import type { FacetDef } from "@/components/data-table/column-meta";
import { DataTableFacetFilter } from "@/components/data-table/data-table-facet-filter";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableSavedViews } from "@/components/data-table/data-table-saved-views";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SavedView, ViewState } from "@/features/saved-views/schemas";
import { csvFileName, toCsv } from "@/lib/export/csv";
import { downloadExcel } from "@/lib/export/excel";
import { downloadPdf } from "@/lib/export/pdf";
import type { ExportTable } from "@/lib/export/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DataTableProps<TData> = {
  /** Key for saved views, e.g. "financiers". */
  tableKey: string;
  columns: ColumnDef<TData>[];
  data: TData[];
  getRowId: (row: TData) => string;
  /** Text the search box matches against (case-insensitive). */
  searchText: (row: TData) => string;
  searchPlaceholder: string;
  facets?: FacetDef[];
  /** Omit to hide the Views menu (small tables inside detail tabs). */
  savedViews?: SavedView[];
  /** Opening a row goes here. The primary cell should also hold a <Link> for keyboard users. */
  rowHref?: (row: TData) => string;
  /** CSV file base name, e.g. "financiers". */
  exportName: string;
  /** Shown when there is no data at all (not when filters hide everything). */
  emptyState: React.ReactNode;
  initialSorting?: SortingState;
  /** Column ids hidden until the user shows them. */
  initialHidden?: string[];
  /** Accessible name for the table. */
  label: string;
  /** Optional company details shown in Excel/PDF headers. */
  exportCompany?: Pick<
    ExportTable,
    "companyName" | "companyAddress" | "companyEmail" | "companyPhone"
  >;
};

const INTERACTIVE = "a, button, input, label, [role=checkbox], [role=menuitem]";

/**
 * DESIGN.md §5 data table: search, facet filters, sorting, pagination, column visibility,
 * saved views, bulk select and CSV export; sticky header, 44px rows, row hover.
 * Client-side: built for the directory-sized lists P&T has (hundreds of rows, not millions).
 */
export function DataTable<TData>({
  tableKey,
  columns,
  data,
  getRowId,
  searchText,
  searchPlaceholder,
  facets = [],
  savedViews,
  rowHref,
  exportName,
  emptyState,
  initialSorting = [],
  initialHidden = [],
  label,
  exportCompany,
}: DataTableProps<TData>) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
    Object.fromEntries(initialHidden.map((id) => [id, false])),
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const searched = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) => searchText(row).toLowerCase().includes(q));
  }, [data, deferredSearch, searchText]);

  // TanStack returns fresh functions each render, so the React Compiler skips this component;
  // that's expected and the table state above is plain React state.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: searched,
    columns,
    getRowId: (row) => getRowId(row),
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
    autoResetPageIndex: true,
  });

  const filterValue = (columnId: string): string[] => {
    const value = columnFilters.find((f) => f.id === columnId)?.value;
    return Array.isArray(value) ? value.map(String) : [];
  };
  const setFilter = (columnId: string, value: string[]) => {
    setActiveViewId(null);
    setColumnFilters((prev) => [
      ...prev.filter((f) => f.id !== columnId),
      ...(value.length > 0 ? [{ id: columnId, value }] : []),
    ]);
  };

  // Counts per facet option across the searched rows, ignoring that facet's own filter.
  const facetCounts = (facet: FacetDef): Record<string, number> => {
    const counts: Record<string, number> = {};
    const column = table.getColumn(facet.columnId);
    if (!column) return counts;
    for (const row of table.getCoreRowModel().rows) {
      const value: unknown = row.getValue(facet.columnId);
      const values = Array.isArray(value) ? value.map(String) : [String(value)];
      for (const v of values) counts[v] = (counts[v] ?? 0) + 1;
    }
    return counts;
  };

  const isFiltered = search.trim() !== "" || columnFilters.length > 0;
  const selectedRows = table.getSelectedRowModel().rows;

  function currentState(): ViewState {
    return {
      search,
      filters: columnFilters.map((f) => ({
        id: f.id,
        value: Array.isArray(f.value) ? f.value.map(String) : [],
      })),
      sorting,
      hidden: Object.entries(columnVisibility)
        .filter(([, visible]) => !visible)
        .map(([id]) => id),
    };
  }

  function applyView(view: SavedView | null) {
    setActiveViewId(view?.id ?? null);
    if (!view) return;
    setSearch(view.state.search);
    setColumnFilters(view.state.filters);
    setSorting(view.state.sorting);
    setColumnVisibility(Object.fromEntries(view.state.hidden.map((id) => [id, false])));
    setRowSelection({});
  }

  function resetFilters() {
    setSearch("");
    setColumnFilters([]);
    setActiveViewId(null);
  }

  function getExportTable(selectedOnly = false): ExportTable {
    const exportColumns = table.getVisibleLeafColumns().filter((c) => !c.columnDef.meta?.noExport);
    const rows =
      selectedOnly && selectedRows.length > 0
        ? selectedRows
        : table.getPrePaginationRowModel().rows;
    return {
      title: label,
      columns: exportColumns.map((c) => c.columnDef.meta?.label ?? c.id),
      rows: rows.map((row) =>
        exportColumns.map((c) => {
          const custom = c.columnDef.meta?.exportValue;
          if (custom) return custom(row.original);
          const value: unknown = row.getValue(c.id);
          if (Array.isArray(value)) return value.join("; ");
          return typeof value === "string" || typeof value === "number" ? value : null;
        }),
      ),
      ...exportCompany,
    };
  }

  function exportCsv(selectedOnly = false) {
    const tableData = getExportTable(selectedOnly);
    const csv = toCsv(tableData.columns, tableData.rows);
    // BOM so Excel reads ₦ and accented names as UTF-8.
    const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = csvFileName(exportName);
    link.click();
    URL.revokeObjectURL(url);
  }

  async function exportExcelFile(selectedOnly = false) {
    setExporting("excel");
    try {
      await downloadExcel({ ...getExportTable(selectedOnly), title: exportName });
    } catch {
      toast.error("Excel export failed. Try again.");
    } finally {
      setExporting(null);
    }
  }

  async function exportPdfFile(selectedOnly = false) {
    setExporting("pdf");
    try {
      await downloadPdf({ ...getExportTable(selectedOnly), title: label });
    } catch {
      toast.error("PDF export failed. Try again.");
    } finally {
      setExporting(null);
    }
  }

  function exportButtons(selectedOnly = false) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => exportCsv(selectedOnly)}>
          <DownloadIcon /> CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          pending={exporting === "excel"}
          disabled={exporting !== null}
          onClick={() => void exportExcelFile(selectedOnly)}
        >
          <FileSpreadsheetIcon /> Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          pending={exporting === "pdf"}
          disabled={exporting !== null}
          onClick={() => void exportPdfFile(selectedOnly)}
        >
          <FileTextIcon /> PDF
        </Button>
      </div>
    );
  }

  function onRowClick(event: React.MouseEvent<HTMLElement>, row: TData) {
    if (!rowHref) return;
    if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
    if (window.getSelection()?.toString()) return; // let people copy text
    const href = rowHref(row);
    if (event.metaKey || event.ctrlKey) window.open(href, "_blank", "noopener");
    else router.push(href);
  }

  if (data.length === 0) return <>{emptyState}</>;

  const pageRows = table.getRowModel().rows;
  const visibleColumns = table.getVisibleLeafColumns().length;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-3 sm:px-4">
        {selectedRows.length > 0 ? (
          <div className="flex items-center gap-2" role="status">
            <span className="text-small font-medium">
              <span className="num">{selectedRows.length}</span> selected
            </span>
            {exportButtons(true)}
            <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
              Clear selection
            </Button>
          </div>
        ) : (
          <>
            <div className="relative w-full sm:w-64">
              <SearchIcon
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActiveViewId(null);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-8 pl-8"
              />
            </div>
            {facets.map((facet) => (
              <DataTableFacetFilter
                key={facet.columnId}
                title={facet.title}
                options={facet.options}
                counts={facetCounts(facet)}
                selected={filterValue(facet.columnId)}
                onChange={(value) => setFilter(facet.columnId, value)}
              />
            ))}
            {isFiltered && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset <XIcon />
              </Button>
            )}
          </>
        )}
        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:justify-end">
          {savedViews && (
            <DataTableSavedViews
              tableKey={tableKey}
              views={savedViews}
              activeViewId={activeViewId}
              currentState={currentState}
              onApply={applyView}
            />
          )}
          <DataTableViewOptions table={table} />
          {selectedRows.length === 0 && exportButtons()}
        </div>
      </div>

      {pageRows.length === 0 ? (
        <EmptyState
          variant="plain"
          icon={<SearchXIcon />}
          title="Nothing matches"
          description="Try a different search or clear the filters."
          action={
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3 p-3 sm:hidden" aria-label={`${label} cards`}>
            {pageRows.map((row) => {
              const cells = row.getVisibleCells().filter((cell) => cell.column.id !== "select");
              const [primary, ...details] = cells;
              return (
                <article
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={(event) => onRowClick(event, row.original)}
                  className={cn(
                    "rounded-xl border border-border bg-surface p-4 shadow-xs",
                    rowHref && "cursor-pointer hover:border-border-strong",
                    row.getIsSelected() && "border-accent-ink bg-accent-soft/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-caption text-muted-foreground">
                        {primary?.column.columnDef.meta?.label ?? primary?.column.id}
                      </p>
                      <div className="mt-1 min-w-0">
                        {primary && flexRender(primary.column.columnDef.cell, primary.getContext())}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {row.getIsSelected() && (
                        <span className="text-caption font-medium text-accent-ink">Selected</span>
                      )}
                    </div>
                  </div>
                  {details.length > 0 && (
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3">
                      {details.map((cell) => (
                        <div key={cell.id} className="min-w-0">
                          <dt className="text-caption text-muted-foreground">
                            {cell.column.columnDef.meta?.label ?? cell.column.id}
                          </dt>
                          <dd
                            className={cn(
                              "mt-1 min-w-0 text-small",
                              !cell.column.columnDef.meta?.noExport && "truncate",
                              cell.column.columnDef.meta?.noExport && "overflow-visible",
                              cell.column.columnDef.meta?.align === "right" && "text-right num",
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </article>
              );
            })}
          </div>
          <div className="hidden sm:block">
            <Table containerClassName="max-h-[calc(100dvh-18rem)] min-h-40" aria-label={label}>
              <TableHeader>
                {table.getHeaderGroups().map((group) => (
                  <TableRow key={group.id}>
                    {group.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(
                          header.column.columnDef.meta?.align === "right" && "text-right",
                          header.column.columnDef.meta?.className,
                        )}
                        aria-sort={
                          header.column.getIsSorted() === "asc"
                            ? "ascending"
                            : header.column.getIsSorted() === "desc"
                              ? "descending"
                              : undefined
                        }
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    onClick={(event) => onRowClick(event, row.original)}
                    className={cn(rowHref && "cursor-pointer")}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.columnDef.meta?.align === "right" && "text-right",
                          cell.column.columnDef.meta?.className,
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <DataTablePagination table={table} />
    </div>
  );
}
