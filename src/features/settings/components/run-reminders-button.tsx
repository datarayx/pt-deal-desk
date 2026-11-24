"use client";

import { PlayIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { runRemindersNow } from "@/features/alerts/actions";

export function RunRemindersButton() {
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await runRemindersNow();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Reminders ran: ${result.data?.alerts ?? 0} alerts, ${result.data?.outbox_emails ?? 0} emails, ${result.data?.follow_up_tasks ?? 0} follow-up tasks.`,
      );
    });
  }

  return (
    <Button type="button" variant="outline" pending={pending} onClick={run}>
      <PlayIcon /> Run reminders now
    </Button>
  );
}
