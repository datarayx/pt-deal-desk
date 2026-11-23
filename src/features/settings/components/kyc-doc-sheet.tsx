"use client";

import type * as React from "react";
import { Controller } from "react-hook-form";

import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveKycDocType } from "@/features/settings/actions/kyc-actions";
import type { KycDocTypeRow } from "@/features/settings/queries";
import { kycDocTypeSchema } from "@/features/settings/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";

const typeLabel = { individual: "individual", company: "company" } as const;

export function KycDocSheet({
  clientType,
  docType,
  trigger,
}: {
  clientType: "individual" | "company";
  docType?: KycDocTypeRow;
  trigger: React.ReactNode;
}) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: kycDocTypeSchema,
    defaultValues: {
      client_type: clientType,
      name: docType?.name ?? "",
      is_required: docType?.is_required ?? true,
      has_expiry: docType?.has_expiry ?? false,
    },
    action: (values) => saveKycDocType(docType?.id ?? null, values),
    successMessage: docType ? "Document updated" : "Document added to the checklist",
  });
  const { errors } = form.formState;

  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={docType ? "Edit checklist document" : `Add a ${typeLabel[clientType]} document`}
      description={`Asked of every ${typeLabel[clientType]} client during KYC.${
        clientType === "individual" ? " Directors of companies use this list too." : ""
      }`}
      submitLabel={docType ? "Save document" : "Add document"}
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field label="Document" htmlFor="kyc-name" required error={errors.name?.message}>
        <Input
          id="kyc-name"
          autoFocus
          placeholder="e.g. Proof of address (utility bill, not older than 3 months)"
          {...form.register("name")}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby="kyc-name-error"
        />
      </Field>

      {(
        [
          ["is_required", "Required", "KYC can't be marked verified until this is received."],
          [
            "has_expiry",
            "Has an expiry date",
            "IDs and similar documents; expired ones are flagged.",
          ],
        ] as const
      ).map(([name, label, hint]) => (
        <Controller
          key={name}
          control={form.control}
          name={name}
          render={({ field }) => (
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <label htmlFor={`kyc-${name}`} className="text-small font-medium">
                  {label}
                </label>
                <p className="text-small text-muted-foreground">{hint}</p>
              </div>
              <Switch id={`kyc-${name}`} checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
      ))}
    </FormSheet>
  );
}
