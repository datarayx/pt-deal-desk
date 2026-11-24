"use client";

import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

/** Error state for a route segment (error.tsx). */
export function RouteError({ what, reset }: { what: string; reset: () => void }) {
  return (
    <EmptyState
      icon={<TriangleAlertIcon />}
      title={`${what} couldn't load`}
      description="Check your connection and try again. If it keeps happening, sign out and back in."
      action={
        <Button variant="outline" onClick={reset}>
          <RotateCwIcon /> Try again
        </Button>
      }
    />
  );
}
