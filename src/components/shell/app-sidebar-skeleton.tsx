import { BrandMark } from "@/components/common/brand-mark";

// Same footprint as <AppSidebar> while the signed-in user loads, so nothing shifts.
export function AppSidebarSkeleton() {
  return (
    <aside
      aria-hidden
      className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex sidebar-collapsed:w-16"
    >
      <div className="flex h-14 items-center gap-2.5 px-4 sidebar-collapsed:justify-center sidebar-collapsed:px-0">
        <BrandMark size={28} />
        <span className="text-body font-semibold text-white sidebar-collapsed:sr-only">
          P&amp;T Deal Desk
        </span>
      </div>
      <div className="space-y-2 px-3 py-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-8 animate-pulse rounded-md bg-white/[0.05]" />
        ))}
      </div>
    </aside>
  );
}
