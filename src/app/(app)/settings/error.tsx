"use client";

import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

// Error state for every Settings section.
export default function SettingsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      icon={<TriangleAlertIcon />}
      title="This section couldn't load"
      description="Check your connection and try again. If it keeps happening, sign out and back in."
      action={
        <Button variant="outline" onClick={reset}>
          <RotateCwIcon /> Try again
        </Button>
      }
    />
  );
}
