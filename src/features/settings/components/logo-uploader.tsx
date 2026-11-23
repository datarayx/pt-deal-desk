"use client";

import { ImageIcon, Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { removeCompanyLogo, uploadCompanyLogo } from "@/features/settings/actions/general-actions";
import { LOGO_MAX_BYTES, LOGO_TYPES } from "@/features/settings/schemas";

export function LogoUploader({
  logoUrl,
  companyName,
}: {
  logoUrl: string | null;
  companyName: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function onFile(file: File | undefined) {
    if (!file) return;
    // Checked again on the server; this just saves a round trip.
    if (!(LOGO_TYPES as readonly string[]).includes(file.type)) {
      toast.error("Use a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error("The logo must be 1 MB or smaller.");
      return;
    }
    const data = new FormData();
    data.set("logo", file);
    startTransition(async () => {
      const result = await uploadCompanyLogo(data);
      if (result.ok) toast.success("Logo updated");
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-subtle">
        {logoUrl ? (
          // Short-lived signed URL from a private bucket, so next/image optimisation doesn't apply.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={`${companyName} logo`} className="size-full object-contain p-2" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
        )}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept={LOGO_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => input.current?.click()}
          >
            {pending ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
            {logoUrl ? "Replace logo" : "Upload logo"}
          </Button>
          {logoUrl && (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm" disabled={pending}>
                  <Trash2Icon /> Remove
                </Button>
              }
              title="Remove the company logo?"
              description="Invoices and reports will show the company name instead."
              confirmLabel="Remove logo"
              onConfirm={async () => {
                const result = await removeCompanyLogo();
                if (result.ok) toast.success("Logo removed");
                else toast.error(result.error);
                return result.ok;
              }}
            />
          )}
        </div>
        <p className="text-small text-muted-foreground">
          PNG, JPEG or WebP, up to 1 MB. A square or wide logo on a transparent background works
          best.
        </p>
      </div>
    </div>
  );
}
