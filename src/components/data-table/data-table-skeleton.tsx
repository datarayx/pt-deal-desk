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
      <div className="hidden sm:block">
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
      <div className="space-y-3 p-3 sm:hidden">
        {Array.from({ length: Math.min(rows, 6) }, (_, r) => (
          <div key={r} className="rounded-xl border border-border p-4">
            <Skeleton className="h-4 w-2/5" />
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
              {Array.from({ length: Math.min(Math.max(columns - 1, 2), 6) }, (_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-3/5" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
