"use client";

import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  FileCheck2Icon,
  FileIcon,
  Loader2Icon,
  UploadIcon,
  XCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { DateText } from "@/components/common/date-text";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getClientSignedFileUrl,
  saveClientDocument,
  updateClientDocumentExpiry,
  verifyClientDocument,
} from "@/features/clients/actions";
import { removeKycFiles, uploadKycFile, KYC_ACCEPT } from "@/features/clients/kyc-upload";
import type { Client360Document } from "@/features/clients/queries";
import { documentStatus } from "@/lib/status";

function DocumentRow({ clientId, document }: { clientId: string; document: Client360Document }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState(document.expiry_date ?? "");

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy("upload");
    const result = await uploadKycFile(
      clientId,
      document.individual_profile_id,
      document.document_type_id,
      file,
    );
    if (!result.ok) {
      setBusy(null);
      toast.error(result.error);
      return;
    }
    const saved = await saveClientDocument({
      client_id: clientId,
      document_id: document.id,
      file_path: result.path,
      expiry_date: expiryDate || null,
    });
    if (!saved.ok) {
      await removeKycFiles([result.path]);
      setBusy(null);
      toast.error(saved.error);
      return;
    }
    if (document.file_path) await removeKycFiles([document.file_path]);
    setBusy(null);
    toast.success(`${document.type_name} uploaded`);
    router.refresh();
  }

  async function saveExpiry() {
    setBusy("expiry");
    const result = await updateClientDocumentExpiry({
      client_id: clientId,
      document_id: document.id,
      expiry_date: expiryDate || null,
    });
    setBusy(null);
    if (!result.ok) toast.error(result.error);
    else {
      toast.success("Expiry date saved");
      router.refresh();
    }
  }

  async function verify() {
    setBusy("verify");
    const result = await verifyClientDocument({ client_id: clientId, document_id: document.id });
    setBusy(null);
    if (!result.ok) toast.error(result.error);
    else {
      toast.success(`${document.type_name} verified`);
      router.refresh();
    }
  }

  async function openFile() {
    setBusy("open");
    const result = await getClientSignedFileUrl({
      client_id: clientId,
      bucket: "kyc",
      path: document.file_path ?? "",
    });
    setBusy(null);
    if (!result.ok || !result.data)
      toast.error(result.ok ? "The file could not be opened." : result.error);
    else window.open(result.data.url, "_blank", "noopener,noreferrer");
  }

  const status = documentStatus[document.status];
  return (
    <li className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-4 first:border-t-0">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {document.status === "verified" ? (
          <FileCheck2Icon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
        ) : document.status === "expired" ? (
          <XCircleIcon className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
        ) : (
          <FileIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-body font-medium">{document.type_name}</p>
            {document.is_required ? (
              <Badge variant="accent">Required</Badge>
            ) : (
              <Badge variant="outline">Optional</Badge>
            )}
          </div>
          <p className="truncate text-small text-muted-foreground">
            {document.file_path ? "Document attached" : "No file uploaded yet"}
            {document.verified_at && (
              <>
                {" · Verified "}
                <DateText value={document.verified_at} />
              </>
            )}
          </p>
        </div>
      </div>
      <StatusBadge status={status} />
      {document.has_expiry && document.file_path && (
        <div className="flex items-center gap-2">
          <label htmlFor={`expiry-${document.id}`} className="sr-only">
            Expiry date for {document.type_name}
          </label>
          <Input
            id={`expiry-${document.id}`}
            type="date"
            value={expiryDate}
            onChange={(event) => setExpiryDate(event.target.value)}
            className="h-8 w-36"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => void saveExpiry()}
          >
            {busy === "expiry" ? <Loader2Icon className="animate-spin" /> : "Save"}
          </Button>
        </div>
      )}
      <div className="flex items-center gap-1">
        {document.file_path && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy !== null}
            onClick={() => void openFile()}
          >
            {busy === "open" ? <Loader2Icon className="animate-spin" /> : <ExternalLinkIcon />}
            Open
          </Button>
        )}
        {document.file_path && document.status === "received" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => void verify()}
          >
            {busy === "verify" ? <Loader2Icon className="animate-spin" /> : <CheckCircle2Icon />}
            Verify
          </Button>
        )}
        <input
          ref={input}
          type="file"
          accept={KYC_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            void upload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy !== null}
          onClick={() => input.current?.click()}
        >
          {busy === "upload" ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
          {document.file_path ? "Replace" : "Upload"}
        </Button>
      </div>
    </li>
  );
}

export function Client360Documents({
  clientId,
  documents,
}: {
  clientId: string;
  documents: Client360Document[];
}) {
  const groups = [...new Set(documents.map((document) => document.person_name))];
  if (documents.length === 0) {
    return (
      <EmptyState
        icon={<FileIcon />}
        title="No KYC checklist yet"
        description="Add a checklist in Settings to track this client's documents."
      />
    );
  }
  return (
    <div className="space-y-4">
      {groups.map((personName) => {
        const items = documents.filter((document) => document.person_name === personName);
        return (
          <Card key={personName}>
            <CardHeader>
              <CardTitle>{personName}</CardTitle>
              <CardDescription>
                {items.filter((item) => item.status === "verified").length} of {items.length}{" "}
                documents verified
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul>
                {items.map((document) => (
                  <DocumentRow key={document.id} clientId={clientId} document={document} />
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
