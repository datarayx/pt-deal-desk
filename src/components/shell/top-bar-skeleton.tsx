import { Skeleton } from "@/components/ui/skeleton";

// Same footprint as <TopBar> while the signed-in user loads.
export function TopBarSkeleton() {
  return (
    <header
      aria-hidden
      className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6"
    >
      <Skeleton className="h-4 w-32" />
      <div className="ml-auto flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-lg sm:w-64" />
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="size-8 rounded-full" />
      </div>
    </header>
  );
}
