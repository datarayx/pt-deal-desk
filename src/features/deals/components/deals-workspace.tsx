"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangleIcon,
  BriefcaseBusinessIcon,
  GripVerticalIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { MoneyText } from "@/components/common/money-text";
import { DataTable } from "@/components/data-table/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { moveDealStage } from "@/features/deals/actions";
import { dealListColumns } from "@/features/deals/deal-list-columns";
import type { DealFormOptions, DealListRow, DealStageOption } from "@/features/deals/queries";
import { sumDecimalStrings } from "@/lib/money/decimal";
import { cn } from "@/lib/utils";

type ViewMode = "kanban" | "table";

export function DealsWorkspace({
  deals,
  stages,
  options,
}: {
  deals: DealListRow[];
  stages: DealStageOption[];
  options: DealFormOptions;
}) {
  const [view, setView] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [financier, setFinancier] = useState("all");
  const [stage, setStage] = useState("all");
  const [facility, setFacility] = useState("all");
  const [referrer, setReferrer] = useState("all");
  const [stageOverrides, setStageOverrides] = useState<Record<string, Partial<DealListRow>>>({});
  const [movingId, setMovingId] = useState<string | null>(null);

  const localDeals = useMemo(
    () => deals.map((deal) => ({ ...deal, ...(stageOverrides[deal.id] ?? {}) })),
    [deals, stageOverrides],
  );

  const filteredDeals = useMemo(() => {
    const query = search.trim().toLowerCase();
    return localDeals.filter((deal) => {
      const matchesSearch =
        !query ||
        [deal.reference, deal.client_name, deal.financier_name, deal.facility_type]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return (
        matchesSearch &&
        (financier === "all" || deal.financier_id === financier) &&
        (stage === "all" || deal.stage_id === stage) &&
        (facility === "all" || deal.facility_type_id === facility) &&
        (referrer === "all" || deal.referrer_id === referrer)
      );
    });
  }, [facility, financier, localDeals, referrer, search, stage]);

  async function handleDragEnd(event: DragEndEvent) {
    const dealId = String(event.active.id);
    const targetStageId = event.over ? String(event.over.id) : null;
    const deal = localDeals.find((item) => item.id === dealId);
    const target = stages.find((item) => item.id === targetStageId);
    if (!deal || !target || deal.stage_id === target.id) return;

    setMovingId(dealId);
    setStageOverrides((current) => ({
      ...current,
      [dealId]: {
        stage_id: target.id,
        stage_name: target.name,
        stage_color: target.color,
        stage_sort_order: target.sort_order,
        is_terminal: target.is_terminal,
        days_in_stage: 0,
        stale: false,
      },
    }));
    const result = await moveDealStage(dealId, target.name);
    setMovingId(null);
    if (!result.ok) {
      setStageOverrides((current) => {
        const next = { ...current };
        delete next[dealId];
        return next;
      });
      toast.error(result.error);
      return;
    }
    toast.success(`${deal.reference} moved to ${target.name}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-xs lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-sm">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search deal, client, financier…"
            aria-label="Search deals"
            className="h-8 pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            value={financier}
            onChange={setFinancier}
            placeholder="Financier"
            options={options.financiers}
          />
          <FilterSelect value={stage} onChange={setStage} placeholder="Stage" options={stages} />
          <FilterSelect
            value={facility}
            onChange={setFacility}
            placeholder="Facility"
            options={options.facilityTypes}
          />
          <FilterSelect
            value={referrer}
            onChange={setReferrer}
            placeholder="Referrer"
            options={options.referrers}
          />
        </div>
        <Tabs
          value={view}
          onValueChange={(value) => setView(value as ViewMode)}
          className="lg:ml-auto"
        >
          <TabsList variant="segmented" aria-label="Deal view">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {localDeals.length === 0 ? (
        <EmptyState
          icon={<BriefcaseBusinessIcon />}
          title="No deals yet"
          description="Open the first deal to start tracking the pipeline."
        />
      ) : view === "kanban" ? (
        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="-mx-1 flex min-h-[30rem] gap-3 overflow-x-auto px-1 pb-3">
            {stages.map((item) => (
              <StageColumn
                key={item.id}
                stage={item}
                deals={filteredDeals.filter((deal) => deal.stage_id === item.id)}
                movingId={movingId}
              />
            ))}
          </div>
        </DndContext>
      ) : (
        <DataTable
          tableKey="deals"
          label="Deals"
          columns={dealListColumns}
          data={filteredDeals}
          getRowId={(deal) => deal.id}
          searchText={(deal) =>
            [
              deal.reference,
              deal.client_name,
              deal.financier_name,
              deal.facility_type,
              deal.stage_name,
            ].join(" ")
          }
          searchPlaceholder="Search within filtered deals…"
          rowHref={(deal) => `/deals/${deal.id}`}
          exportName="deals"
          initialSorting={[{ id: "created_at", desc: true }]}
          initialHidden={["outcome", "created_at"]}
          emptyState={
            <EmptyState
              icon={<SearchIcon />}
              title="No matching deals"
              description="Try changing the filters or search term."
            />
          }
        />
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { id: string; name: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-[8.5rem]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {placeholder.toLowerCase()}s</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StageColumn({
  stage,
  deals,
  movingId,
}: {
  stage: DealStageOption;
  deals: DealListRow[];
  movingId: string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id });
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[18rem] shrink-0 flex-col rounded-xl border border-border bg-surface-subtle/55 transition-colors",
        isOver && "border-brand bg-brand/5",
      )}
      aria-label={`${stage.name} deals`}
    >
      <header className="border-b border-border px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-small font-semibold">{stage.name}</h2>
          <span className="num text-caption text-muted-foreground">{deals.length}</span>
        </div>
        <MoneyText
          value={sumDecimalStrings(deals.map((deal) => deal.amount))}
          compact
          className="mt-1 text-small font-medium"
        />
      </header>
      <div className="flex min-h-32 flex-1 flex-col gap-2 p-2">
        {deals.length === 0 ? (
          <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border px-3 text-center text-caption text-muted-foreground">
            Drop deals here
          </div>
        ) : (
          deals.map((deal) => <DealCard key={deal.id} deal={deal} moving={movingId === deal.id} />)
        )}
      </div>
    </section>
  );
}

function DealCard({ deal, moving }: { deal: DealListRow; moving: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "rounded-lg border border-border bg-card p-3 shadow-xs transition-shadow",
        isDragging && "z-10 shadow-lg",
        moving && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab rounded p-0.5 text-muted-foreground hover:bg-surface-subtle hover:text-foreground active:cursor-grabbing"
          aria-label={`Drag ${deal.reference}`}
          {...listeners}
          {...attributes}
        >
          <GripVerticalIcon className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <Link
            href={`/deals/${deal.id}`}
            className="num text-small font-semibold text-accent-ink hover:underline"
          >
            {deal.reference}
          </Link>
          <Link
            href={`/clients/${deal.client_id}`}
            className="mt-1 block truncate text-small font-medium hover:text-accent-ink hover:underline"
          >
            {deal.client_name}
          </Link>
        </div>
        {deal.stale && (
          <AlertTriangleIcon className="size-4 shrink-0 text-warning" aria-label="Stale deal" />
        )}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-caption text-muted-foreground">{deal.financier_name}</p>
          <p className="mt-1 text-small font-medium">
            <MoneyText value={deal.amount} />
          </p>
        </div>
        <div className="text-right text-caption text-muted-foreground">
          <p className="num">{deal.days_in_stage}d in stage</p>
          <p className={cn("mt-1 num", deal.deficiency_count > 0 && "text-warning")}>
            {deal.deficiency_count} deficient
          </p>
        </div>
      </div>
    </article>
  );
}
