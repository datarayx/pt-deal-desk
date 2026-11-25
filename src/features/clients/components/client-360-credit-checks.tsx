"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLinkIcon, FileTextIcon, PlusIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { DateText } from "@/components/common/date-text";
import { EmptyState } from "@/components/common/empty-state";
import { Field } from "@/components/common/field";
import { MoneyText } from "@/components/common/money-text";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormSheet } from "@/components/common/form-sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fieldClassName } from "@/components/ui/styles";
import { addCreditCheck, getClientSignedFileUrl } from "@/features/clients/actions";
import {
  CREDIT_REPORT_ACCEPT,
  removeCreditReport,
  uploadCreditReport,
} from "@/features/clients/credit-upload";
import type { Client360 } from "@/features/clients/queries";
import { creditCheckSchema } from "@/features/clients/schemas";

type CreditCheckForm = z.input<typeof creditCheckSchema>;

const exposureStatus = {
  active: { label: "Active", tone: "info" as const },
  closed: { label: "Closed", tone: "neutral" as const },
  delinquent: { label: "Delinquent", tone: "danger" as const },
};

function CreditCheckSheet({ clientId }: { clientId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [report, setReport] = useState<File | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const form = useForm<CreditCheckForm>({
    resolver: zodResolver(creditCheckSchema as never) as unknown as Resolver<CreditCheckForm>,
    defaultValues: {
      client_id: clientId,
      bureau: "CRC",
      check_date: new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date()),
      rating: "",
      score: "",
      total_exposure: "",
      delinquent_facilities: "0",
      remarks: "",
      report_file_path: "",
      exposures: [],
    },
  });
  const exposures = useFieldArray({ control: form.control, name: "exposures" });

  function chooseReport(file: File | undefined) {
    if (!file) return;
    setReportError(null);
    setReport(file);
  }

  async function submit(values: CreditCheckForm) {
    setPending(true);
    setFormError(null);
    let reportPath = "";
    if (report) {
      const uploaded = await uploadCreditReport(clientId, report);
      if (!uploaded.ok) {
        setPending(false);
        setReportError(uploaded.error);
        return;
      }
      reportPath = uploaded.path;
    }
    const result = await addCreditCheck({
      ...values,
      client_id: clientId,
      report_file_path: reportPath,
    });
    if (!result.ok) {
      if (reportPath) await removeCreditReport(reportPath);
      setPending(false);
      setFormError(result.error);
      return;
    }
    setPending(false);
    setOpen(false);
    setReport(null);
    form.reset({ ...form.getValues(), report_file_path: "", exposures: [] });
    toast.success("Credit check added");
    router.refresh();
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button>
          <PlusIcon /> Add credit check
        </Button>
      }
      title="Add credit check"
      description="Record the bureau result and any external lender exposure reported on the check date."
      submitLabel="Save credit check"
      pending={pending}
      formError={formError}
      onSubmit={form.handleSubmit(submit)}
    >
      <input type="hidden" {...form.register("client_id")} />
      <Field
        label="Bureau"
        htmlFor="credit-bureau"
        required
        error={form.formState.errors.bureau?.message}
      >
        <select id="credit-bureau" className={fieldClassName} {...form.register("bureau")}>
          <option value="CRC">CRC</option>
          <option value="FirstCentral">FirstCentral</option>
          <option value="CreditRegistry">CreditRegistry</option>
          <option value="Other">Other</option>
        </select>
      </Field>
      <Field
        label="Check date"
        htmlFor="credit-check-date"
        required
        error={form.formState.errors.check_date?.message}
      >
        <Input id="credit-check-date" type="date" {...form.register("check_date")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Rating" htmlFor="credit-rating" hint="Optional bureau rating">
          <Input id="credit-rating" placeholder="e.g. A2" {...form.register("rating")} />
        </Field>
        <Field label="Score" htmlFor="credit-score" hint="Optional, 0–1000">
          <Input id="credit-score" inputMode="numeric" {...form.register("score")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bureau-reported exposure" htmlFor="credit-exposure" hint="₦ amount">
          <Input
            id="credit-exposure"
            inputMode="decimal"
            placeholder="0.00"
            {...form.register("total_exposure")}
          />
        </Field>
        <Field label="Delinquent facilities" htmlFor="credit-delinquent" required>
          <Input
            id="credit-delinquent"
            inputMode="numeric"
            {...form.register("delinquent_facilities")}
          />
        </Field>
      </div>
      <Field label="Report" htmlFor="credit-report">
        <input
          ref={input}
          id="credit-report"
          type="file"
          accept={CREDIT_REPORT_ACCEPT}
          className="sr-only"
          onChange={(event) => {
            chooseReport(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Button type="button" variant="outline" onClick={() => input.current?.click()}>
          <UploadIcon /> {report ? "Replace report" : "Upload report"}
        </Button>
        {report && <p className="mt-1 text-small text-muted-foreground">{report.name}</p>}
        {reportError && <p className="mt-1 text-small text-danger">{reportError}</p>}
      </Field>
      <Field label="Remarks" htmlFor="credit-remarks">
        <Textarea
          id="credit-remarks"
          placeholder="Key observations from the bureau report"
          {...form.register("remarks")}
        />
      </Field>
      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-small font-semibold">External exposures</h3>
            <p className="text-small text-muted-foreground">
              Itemise lenders and their current balances.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              exposures.append({
                lender_name: "",
                facility_type: "",
                amount: "",
                outstanding: "",
                status: "active",
              })
            }
          >
            <PlusIcon /> Add lender
          </Button>
        </div>
        {exposures.fields.map((field, index) => (
          <div key={field.id} className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-small font-medium">Lender {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove lender ${index + 1}`}
                onClick={() => exposures.remove(index)}
              >
                <Trash2Icon />
              </Button>
            </div>
            <Input placeholder="Lender name" {...form.register(`exposures.${index}.lender_name`)} />
            <Input
              placeholder="Facility type"
              {...form.register(`exposures.${index}.facility_type`)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Original amount"
                inputMode="decimal"
                {...form.register(`exposures.${index}.amount`)}
              />
              <Input
                placeholder="Outstanding"
                inputMode="decimal"
                {...form.register(`exposures.${index}.outstanding`)}
              />
            </div>
            <select className={fieldClassName} {...form.register(`exposures.${index}.status`)}>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="delinquent">Delinquent</option>
            </select>
          </div>
        ))}
      </div>
    </FormSheet>
  );
}

function CreditReportLink({ clientId, path }: { clientId: string; path: string }) {
  const [busy, setBusy] = useState(false);
  async function openReport() {
    setBusy(true);
    const result = await getClientSignedFileUrl({
      client_id: clientId,
      bucket: "credit-reports",
      path,
    });
    setBusy(false);
    if (!result.ok || !result.data)
      toast.error(result.ok ? "The report could not be opened." : result.error);
    else window.open(result.data.url, "_blank", "noopener,noreferrer");
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={busy}
      onClick={() => void openReport()}
    >
      <ExternalLinkIcon /> Open report
    </Button>
  );
}

export function Client360CreditChecks({
  clientId,
  creditChecks,
  exposures,
}: Pick<Client360, "creditChecks" | "exposures"> & { clientId: string }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-h2">Credit checks</h2>
          <p className="text-body text-muted-foreground">
            Bureau history and external exposure snapshots.
          </p>
        </div>
        <CreditCheckSheet clientId={clientId} />
      </div>
      {creditChecks.length === 0 ? (
        <EmptyState
          icon={<FileTextIcon />}
          title="No credit checks yet"
          description="Add the latest bureau check and its reported exposures."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {creditChecks.map((check) => (
            <Card key={check.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>
                      {check.bureau}
                      {check.rating ? ` · ${check.rating}` : ""}
                    </CardTitle>
                    <CardDescription>
                      <DateText value={check.check_date} /> · {check.delinquent_facilities}{" "}
                      delinquent facilities
                    </CardDescription>
                  </div>
                  {check.report_file_path && (
                    <CreditReportLink clientId={clientId} path={check.report_file_path} />
                  )}
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-caption text-muted-foreground">Score</p>
                  <p className="num text-body font-medium">{check.score ?? "—"}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">Total exposure</p>
                  <MoneyText
                    value={check.total_exposure === null ? null : String(check.total_exposure)}
                  />
                </div>
                {check.remarks && (
                  <p className="text-small text-muted-foreground sm:col-span-2">{check.remarks}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>External exposures</CardTitle>
          <CardDescription>
            Itemised lender exposure; this is the source of truth for current external debt.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {exposures.length === 0 ? (
            <EmptyState
              variant="plain"
              title="No external exposures recorded"
              description="Add them while recording a credit check."
            />
          ) : (
            <div className="overflow-x-auto" data-mobile-cards="true">
              <table className="w-full text-small">
                <thead className="border-b border-border bg-surface-subtle text-left text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Lender</th>
                    <th className="px-5 py-3 font-medium">Facility</th>
                    <th className="px-5 py-3 text-right font-medium">Outstanding</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {exposures.map((exposure) => (
                    <tr key={exposure.id}>
                      <td data-label="Lender" className="px-5 py-3 font-medium">
                        {exposure.lender_name}
                      </td>
                      <td data-label="Facility" className="px-5 py-3 text-muted-foreground">
                        {exposure.facility_type ?? "—"}
                      </td>
                      <td data-label="Outstanding" className="px-5 py-3 text-right">
                        <MoneyText value={String(exposure.outstanding)} />
                      </td>
                      <td data-label="Status" className="px-5 py-3">
                        <StatusBadge status={exposureStatus[exposure.status]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
