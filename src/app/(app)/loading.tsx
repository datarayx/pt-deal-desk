import { Skeleton } from "@/components/ui/skeleton";

/** Shared route transition state for screens without a more specific Suspense boundary. */
export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
        <div className="space-y-4">
          <Skeleton className="h-8 w-full max-w-sm" />
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
