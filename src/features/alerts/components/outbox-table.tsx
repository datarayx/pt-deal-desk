"use client";

import { MailOpenIcon } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { DateText } from "@/components/common/date-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OutboxEmail } from "@/features/alerts/queries";

const statusVariant = {
  demo: "info",
  queued: "warning",
  sent: "success",
} as const;

export function OutboxTable({ emails }: { emails: OutboxEmail[] }) {
  const [selected, setSelected] = useState<OutboxEmail | null>(null);

  if (emails.length === 0) {
    return (
      <EmptyState
        variant="card"
        icon={<MailOpenIcon />}
        title="Outbox is empty"
        description="Run the demo reminders from Settings to generate preview emails here."
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.map((email) => (
              <TableRow key={email.id}>
                <TableCell className="max-w-[26rem]">
                  <span className="block truncate font-medium">{email.subject}</span>
                  {email.related_entity && (
                    <span className="block truncate text-caption text-muted-foreground">
                      {email.related_entity}
                    </span>
                  )}
                </TableCell>
                <TableCell className="max-w-[18rem]">
                  <span className="block truncate text-small">{email.to_emails.join(", ")}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[email.status]}>{email.status}</Badge>
                </TableCell>
                <TableCell>
                  <DateText value={email.created_at} withTime />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setSelected(email)}>
                    <MailOpenIcon /> Preview
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Email preview</SheetTitle>
            <SheetDescription>{selected?.subject ?? "Generated reminder email"}</SheetDescription>
          </SheetHeader>
          {selected && (
            <SheetBody className="space-y-4">
              <dl className="grid gap-3 rounded-lg border border-border bg-surface-subtle/50 p-4 text-small sm:grid-cols-[auto_1fr]">
                <dt className="font-medium text-muted-foreground">To</dt>
                <dd className="break-words">{selected.to_emails.join(", ")}</dd>
                <dt className="font-medium text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={statusVariant[selected.status]}>{selected.status}</Badge>
                </dd>
                <dt className="font-medium text-muted-foreground">Created</dt>
                <dd>
                  <DateText value={selected.created_at} withTime />
                </dd>
              </dl>
              <iframe
                title={`Preview of ${selected.subject}`}
                srcDoc={selected.html}
                sandbox=""
                className="h-[min(65vh,40rem)] w-full rounded-lg border border-border bg-white"
              />
            </SheetBody>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
