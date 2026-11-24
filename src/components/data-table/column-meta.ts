import type { FilterFn, RowData } from "@tanstack/react-table";

// Extra per-column settings the DataTable understands (DESIGN.md §5).
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- must match TanStack's generics
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Human name for the column menu and the CSV header. */
    label?: string;
    /** Right-align numbers and money (DESIGN.md §3b). */
    align?: "left" | "right";
    /** Value written to CSV; defaults to the accessor value. Money: the raw decimal string. */
    exportValue?: (row: TData) => string | number | null | undefined;
    /** Leave out of CSV (actions, selection). */
    noExport?: boolean;
    className?: string;
  }
}

/**
 * Multi-select filter: keeps a row when its value (or any item of an array value) is one of the
 * chosen options. An empty choice keeps everything.
 */
export function facetFilter<TData extends RowData>(): FilterFn<TData> {
  return (row, columnId, chosen: string[]) => {
    if (!Array.isArray(chosen) || chosen.length === 0) return true;
    const value: unknown = row.getValue(columnId);
    if (Array.isArray(value)) return value.some((v) => chosen.includes(String(v)));
    return chosen.includes(String(value));
  };
}

export type FacetOption = { value: string; label: string };
export type FacetDef = { columnId: string; title: string; options: FacetOption[] };
