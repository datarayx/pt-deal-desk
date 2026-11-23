import { DownloadIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ButtonGallery() {
  return (
    <div className="space-y-5 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button>
          <PlusIcon /> New deal
        </Button>
        <Button variant="outline">
          <DownloadIcon /> Export
        </Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">
          <Trash2Icon /> Delete
        </Button>
        <Button variant="link">View all</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" variant="outline" aria-label="Add">
          <PlusIcon />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button pending>Saving…</Button>
        <Button variant="outline" pending>
          Exporting
        </Button>
        <Button disabled>Disabled</Button>
        <Button variant="outline" disabled>
          Disabled
        </Button>
      </div>
    </div>
  );
}
