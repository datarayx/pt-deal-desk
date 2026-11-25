"use client";

import ExcelJS from "exceljs";
import { CheckCircle2Icon, DownloadIcon, FileSpreadsheetIcon, UploadIcon } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import type * as React from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Field } from "@/components/common/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  cancelImport,
  commitImport,
  stageImport,
  type ImportCommitResult,
} from "@/features/imports/actions";
import {
  definitionFor,
  importDefinitions,
  type ImportDomain,
  type ImportMode,
} from "@/features/imports/catalog";
import type { StagedImport } from "@/features/imports/actions";
import type { Role } from "@/lib/auth/access";

function safeFileName(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "import-template"
  );
}

async function downloadTemplate(domain: ImportDomain) {
  const definition = definitionFor(domain);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "P&T Deal Desk";
  for (const sheetDefinition of definition.sheets) {
    const sheet = workbook.addWorksheet(sheetDefinition.name);
    sheet.addRow(sheetDefinition.columns);
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF011A32" } };
    sheet.getRow(1).alignment = { vertical: "middle" };
    sheet.addRow(
      sheetDefinition.columns.map((column) => (column.endsWith("_id") ? "EXAMPLE-001" : "")),
    );
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.getRow(2).font = { color: { argb: "FF7C93AB" }, italic: true };
    sheetDefinition.columns.forEach((column, index) => {
      sheet.getColumn(index + 1).width = Math.max(16, Math.min(34, column.length + 4));
    });
  }
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(definition.label)}-template.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ImportsWorkspace({ role }: { role: Role }) {
  const available = useMemo(
    () => importDefinitions.filter((definition) => definition.roles.includes(role)),
    [role],
  );
  const [domain, setDomain] = useState<ImportDomain>(available[0]?.domain ?? "accounting");
  const [mode, setMode] = useState<ImportMode>("historical");
  const [fileName, setFileName] = useState("");
  const [staged, setStaged] = useState<StagedImport | null>(null);
  const [commitResult, setCommitResult] = useState<ImportCommitResult | null>(null);
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const definition = definitionFor(domain);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = input.current?.files?.[0];
    if (!file) {
      toast.error("Choose an Excel workbook first.");
      return;
    }
    const formData = new FormData();
    formData.set("domain", domain);
    formData.set("mode", mode);
    formData.set("file", file);
    startTransition(async () => {
      const result = await stageImport(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (!result.data) {
        toast.error("The import was staged without a preview.");
        return;
      }
      setStaged(result.data);
      setCommitResult(null);
      toast.success(`${result.data.rowCount} rows staged for review.`);
    });
  }

  async function discard() {
    if (!staged) return;
    const result = await cancelImport(staged.batchId);
    if (result.ok) {
      setStaged(null);
      setFileName("");
      if (input.current) input.current.value = "";
      toast.success("Import discarded.");
    } else toast.error(result.error);
  }

  function commit() {
    if (!staged) return;
    startTransition(async () => {
      const result = await commitImport(staged.batchId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCommitResult(result.data ?? null);
      if (result.data?.errors.length)
        toast.error(`${result.data.errors.length} rows could not be imported.`);
      else {
        setStaged(null);
        toast.success(`${result.data?.processed ?? 0} rows imported successfully.`);
      }
    });
  }

  if (available.length === 0) {
    return (
      <EmptyState
        icon={<FileSpreadsheetIcon />}
        title="No import types available"
        description="Your role has no permitted bulk-import domains."
      />
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Choose an import</CardTitle>
          <CardDescription>
            Use a separate workbook for each data domain. Historical mode preserves old dates and
            does not trigger live automations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Data domain" htmlFor="import-domain">
              <Select
                value={domain}
                onValueChange={(value) => {
                  setDomain(value as ImportDomain);
                  setStaged(null);
                }}
              >
                <SelectTrigger id="import-domain">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {available.map((item) => (
                    <SelectItem key={item.domain} value={item.domain}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Import mode" htmlFor="import-mode">
              <Select value={mode} onValueChange={(value) => setMode(value as ImportMode)}>
                <SelectTrigger id="import-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="historical">Historical migration</SelectItem>
                  <SelectItem value="live">Live records</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="rounded-lg border border-border bg-surface-subtle p-4 text-small text-muted-foreground">
            <p className="font-medium text-foreground">{definition.description}</p>
            <p className="mt-1">{definition.historicalWarning}</p>
            <ul className="mt-3 grid gap-1 sm:grid-cols-2">
              {definition.sheets.map((sheet) => (
                <li key={sheet.name}>
                  <span className="font-medium text-foreground">{sheet.name}</span>: {sheet.help}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void downloadTemplate(domain)}>
              <DownloadIcon /> Download template
            </Button>
          </div>
          <form className="space-y-3" onSubmit={submit}>
            <Field
              label="Completed workbook"
              htmlFor="import-file"
              hint="Excel .xlsx only, maximum 20 MB. Attachments are uploaded separately."
            >
              <Input
                ref={input}
                id="import-file"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={pending}
                onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" pending={pending} disabled={!fileName || pending}>
                <UploadIcon /> Stage and validate
              </Button>
              {fileName && <span className="text-small text-muted-foreground">{fileName}</span>}
            </div>
          </form>
        </CardContent>
      </Card>
      {staged && (
        <ImportPreview
          staged={staged}
          commitResult={commitResult}
          onCommit={commit}
          onDiscard={() => void discard()}
          pending={pending}
        />
      )}
    </div>
  );
}

function ImportPreview({
  staged,
  commitResult,
  onCommit,
  onDiscard,
  pending,
}: {
  staged: StagedImport;
  commitResult: ImportCommitResult | null;
  onCommit: () => void;
  onDiscard: () => void;
  pending: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Validation preview</CardTitle>
            <CardDescription>
              {staged.sourceName} · batch {staged.batchId.slice(0, 8)}
            </CardDescription>
          </div>
          <Badge variant={staged.errorCount === 0 ? "success" : "danger"}>
            {staged.errorCount === 0 ? "Ready to review" : `${staged.errorCount} errors`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {commitResult?.errors.length ? (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-small">
            <p className="font-medium">The batch finished with row errors.</p>
            <ul className="mt-2 list-disc pl-5 text-muted-foreground">
              {commitResult.errors.slice(0, 20).map((error, index) => (
                <li key={`${error.sheet}-${error.row}-${index}`}>
                  {error.sheet} row {error.row}: {error.error}
                </li>
              ))}
            </ul>
          </div>
        ) : staged.errorCount === 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-4 text-small">
            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" />
            <div>
              <p className="font-medium">No structural or required-field errors found.</p>
              <p className="text-muted-foreground">
                The rows are staged. Commit controls will use this validated batch without changing
                the source workbook.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-small">
            <p className="font-medium">Fix the workbook and upload it again.</p>
            <ul className="mt-2 list-disc pl-5 text-muted-foreground">
              {staged.errors.slice(0, 20).map((error, index) => (
                <li key={`${error.sheet}-${error.row}-${index}`}>
                  {error.sheet} row {error.row}: {error.errors.join(" ")}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-small">
            <thead>
              <tr className="border-b border-border bg-surface-subtle text-left">
                <th className="px-3 py-2">Sheet</th>
                <th className="px-3 py-2">Row</th>
                <th className="px-3 py-2">Preview</th>
              </tr>
            </thead>
            <tbody>
              {staged.preview.slice(0, 12).map((row) => (
                <tr className="border-b border-border/60" key={`${row.sheet}-${row.row}`}>
                  <td className="px-3 py-2 font-medium">{row.sheet}</td>
                  <td className="px-3 py-2 num">{row.row}</td>
                  <td className="max-w-xl truncate px-3 py-2 text-muted-foreground">
                    {Object.entries(row.payload)
                      .filter(([, value]) => value)
                      .slice(0, 5)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-2">
          {staged.errorCount === 0 && !commitResult && (
            <Button type="button" disabled={pending} onClick={onCommit}>
              <CheckCircle2Icon /> Commit import
            </Button>
          )}
          <Button type="button" variant="outline" disabled={pending} onClick={onDiscard}>
            Discard staged batch
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

