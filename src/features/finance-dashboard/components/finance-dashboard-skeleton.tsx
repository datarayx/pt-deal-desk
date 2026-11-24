import { Skeleton } from "@/components/ui/skeleton";

export function FinanceDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading finance dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="mt-2 h-3 w-64" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
