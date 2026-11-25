import { Skeleton } from "@/components/ui/skeleton";

function WidgetSkeleton({ chart = false }: { chart?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-56 max-w-full" />
      </div>
      {chart ? (
        <Skeleton className="mt-6 h-56 w-full" />
      ) : (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
      <WidgetSkeleton />
      <div className="grid gap-6 xl:grid-cols-2">
        <WidgetSkeleton />
        <WidgetSkeleton />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <WidgetSkeleton chart />
        <WidgetSkeleton chart />
        <WidgetSkeleton chart />
        <WidgetSkeleton chart />
        <WidgetSkeleton chart />
      </div>
      <WidgetSkeleton />
    </div>
  );
}

