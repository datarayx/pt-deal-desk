"use client";

import { ExternalLinkIcon, LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function OpenPrivateFileButton<T>({
  action,
  input,
  label = "Open",
}: {
  action: (input: T) => Promise<ActionResult<{ url: string }>>;
  input: T;
  label?: string;
}) {
  const [pending, setPending] = useState(false);
  async function openFile() {
    setPending(true);
    const result = await action(input);
    setPending(false);
    if (!result.ok || !result.data) {
      toast.error(result.ok ? "The file could not be opened." : result.error);
      return;
    }
    window.open(result.data.url, "_blank", "noopener,noreferrer");
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={openFile} disabled={pending}>
      {pending ? <LoaderCircleIcon className="animate-spin" /> : <ExternalLinkIcon />}
      {pending ? "Opening…" : label}
    </Button>
  );
}

