import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder shaped like a DataTable: toolbar, header and rows. */
export function DataTableSkeleton({ columns = 5, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
      aria-busy="true"
      aria-label="Loading table"
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="ml-auto h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex h-9 items-center gap-6 border-b border-border px-4">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={r}
          className="flex h-11 items-center gap-6 border-b border-border px-4 last:border-b-0"
        >
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={i} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
