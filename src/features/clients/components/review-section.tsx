"use client";

import { PencilIcon } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";

/** A summary block on the Review step with an Edit link back to its step. */
export function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-surface-subtle/50 px-4 py-2">
        <h3 className="text-small font-semibold">{title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <PencilIcon /> Edit
        </Button>
      </div>
      {children}
    </section>
  );
}
