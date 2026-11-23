"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";
import { useId, useState, useTransition } from "react";
import type * as React from "react";

import { cn } from "@/lib/utils";

type Item = { id: string };

// Drag-to-reorder list (mouse, touch and keyboard: focus the handle, Space, arrows, Space).
// Reorders optimistically; if onReorder fails the previous order comes back.
export function SortableList<T extends Item>({
  items,
  onReorder,
  renderItem,
  label,
}: {
  items: readonly T[];
  /** Persist the new order. Return false to roll back. */
  onReorder: (orderedIds: string[]) => Promise<boolean>;
  renderItem: (item: T) => React.ReactNode;
  /** What is being ordered, for screen readers ("deal stages"). */
  label: string;
}) {
  const [order, setOrder] = useState<T[]>([...items]);
  const [previousItems, setPreviousItems] = useState(items);
  const [, startTransition] = useTransition();
  // Stable id so dnd-kit's aria-describedby matches between server and client render.
  const dndId = useId();

  // Server data changed (add/edit/delete/refresh): adopt it — React's "adjust state when a prop
  // changes" pattern, during render rather than in an effect
  if (items !== previousItems) {
    setPreviousItems(items);
    setOrder([...items]);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const previous = order;
    const next = arrayMove(
      order,
      order.findIndex((i) => i.id === active.id),
      order.findIndex((i) => i.id === over.id),
    );
    setOrder(next);
    startTransition(async () => {
      if (!(await onReorder(next.map((i) => i.id)))) setOrder(previous);
    });
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable: `To reorder ${label}, press Space to pick up, use the arrow keys to move, and Space again to drop.`,
        },
      }}
    >
      <SortableContext items={order.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="divide-y divide-border">
          {order.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {renderItem(item)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative flex items-center gap-2 bg-surface pr-3 pl-1.5",
        isDragging && "z-10 rounded-lg shadow-md ring-1 ring-border",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label="Drag to reorder"
        className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-surface-subtle hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}
