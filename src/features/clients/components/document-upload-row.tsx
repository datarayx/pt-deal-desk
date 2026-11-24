"use client";

import { CheckCircle2Icon, FileIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { KycChecklistItem } from "@/features/clients/queries";
import type { DocumentInput } from "@/features/clients/schemas";
import { KYC_ACCEPT, removeKycFiles, uploadKycFile } from "@/features/clients/kyc-upload";

/** One checklist item: upload, replace or remove its file; expiry date when the type has one. */
export function DocumentUploadRow({
  clientId,
  personId,
  item,
  document,
  onChange,
}: {
  clientId: string;
  personId: string | null;
  item: KycChecklistItem;
  document: DocumentInput | undefined;
  onChange: (doc: DocumentInput | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = `doc-${personId ?? "client"}-${item.id}`;

  async function choose(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    const result = await uploadKycFile(clientId, personId, item.id, file);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (document) void removeKycFiles([document.file_path]);
    onChange({
      document_type_id: item.id,
      person_id: personId,
      file_path: result.path,
      file_name: file.name.slice(0, 255),
      expiry_date: document?.expiry_date ?? "",
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {document ? (
          <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" aria-label="Attached" />
        ) : (
          <FileIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <div className="min-w-0 space-y-0.5">
          <p className="text-body">
            {item.name}{" "}
            {item.is_required ? (
              <Badge variant="accent" className="ml-1">
                Required
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-1">
                Optional
              </Badge>
            )}
          </p>
          {document && (
            <p className="truncate text-small text-muted-foreground">{document.file_name}</p>
          )}
          {error && (
            <p className="text-small text-danger" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      {document && item.has_expiry && (
        <label className="flex items-center gap-2 text-small text-muted-foreground">
          Expires
          <Input
            type="date"
            value={document.expiry_date}
            onChange={(e) => onChange({ ...document, expiry_date: e.target.value })}
            className="h-8 w-40"
            aria-label={`${item.name} expiry date`}
          />
        </label>
      )}

      <div className="flex items-center gap-1">
        <input
          ref={input}
          id={inputId}
          type="file"
          accept={KYC_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            void choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => input.current?.click()}
          aria-label={`${document ? "Replace" : "Upload"} ${item.name}`}
        >
          {busy ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
          {busy ? "Uploading…" : document ? "Replace" : "Upload"}
        </Button>
        {document && !busy && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${item.name}`}
            onClick={() => {
              void removeKycFiles([document.file_path]);
              onChange(null);
            }}
          >
            <XIcon />
          </Button>
        )}
      </div>
    </li>
  );
}
