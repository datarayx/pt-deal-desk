"use client";

import { useRouter } from "next/navigation";
import type * as React from "react";
import { Controller } from "react-hook-form";

import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { ToggleChips } from "@/components/common/toggle-chips";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveFinancier } from "@/features/financiers/actions";
import type { FinancierDetail } from "@/features/financiers/queries";
import {
  FINANCIER_TYPES,
  financierSchema,
  financierTypeLabel,
} from "@/features/financiers/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";

export function FinancierSheet({
  financier,
  facilityTypeNames,
  trigger,
}: {
  financier?: FinancierDetail;
  facilityTypeNames: string[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: financierSchema,
    defaultValues: {
      name: financier?.name ?? "",
      financier_type: financier?.financier_type ?? "finance_house",
      contact_person: financier?.contact_person ?? "",
      phone: financier?.phone ?? "",
      email: financier?.email ?? "",
      rate_min_monthly: financier?.rate_min_monthly ?? "",
      rate_max_monthly: financier?.rate_max_monthly ?? "",
      facility_types: financier?.facility_types ?? [],
      collateral_policy: financier?.collateral_policy ?? "",
      notes: financier?.notes ?? "",
    },
    action: (values) => saveFinancier(financier?.id ?? null, values),
    successMessage: financier ? "Financier updated" : "Financier added",
    onSuccess: (data) => {
      if (!financier && data) router.push(`/financiers/${data.id}`);
    },
  });
  const { errors } = form.formState;

  // Settings' facility types, plus any older name this financier still lists.
  const facilityOptions = [
    ...new Set([...facilityTypeNames, ...(financier?.facility_types ?? [])]),
  ].map((n) => ({ value: n, label: n }));

  const text = (
    name: "name" | "contact_person" | "phone" | "email",
    label: string,
    opts: { required?: boolean; type?: string; placeholder?: string; autoFocus?: boolean } = {},
  ) => (
    <Field
      label={label}
      htmlFor={`fin-${name}`}
      required={opts.required}
      error={errors[name]?.message}
    >
      <Input
        id={`fin-${name}`}
        type={opts.type ?? "text"}
        placeholder={opts.placeholder}
        autoFocus={opts.autoFocus}
        autoComplete="off"
        {...form.register(name)}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={`fin-${name}-error`}
      />
    </Field>
  );

  const rateInput = (name: "rate_min_monthly" | "rate_max_monthly", label: string) => (
    <Field label={label} htmlFor={`fin-${name}`} error={errors[name]?.message}>
      <div className="relative">
        <Input
          id={`fin-${name}`}
          inputMode="decimal"
          className="pr-8 text-right num"
          {...form.register(name)}
          aria-invalid={errors[name] ? true : undefined}
          aria-describedby={`fin-${name}-error`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-small text-muted-foreground">
          %
        </span>
      </div>
    </Field>
  );

  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={financier ? `Edit ${financier.name}` : "Add a financier"}
      description="A finance house or bank P&T places deals with."
      submitLabel={financier ? "Save financier" : "Add financier"}
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      {text("name", "Name", {
        required: true,
        autoFocus: true,
        placeholder: "e.g. Crestline Finance House",
      })}
      <Field label="Type" htmlFor="fin-type" required>
        <Controller
          control={form.control}
          name="financier_type"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="fin-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FINANCIER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {financierTypeLabel[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <div className="space-y-4 border-t border-border pt-5">
        <h3 className="text-small font-semibold tracking-wide text-muted-foreground uppercase">
          Contact
        </h3>
        {text("contact_person", "Contact person")}
        <div className="grid gap-4 sm:grid-cols-2">
          {text("phone", "Phone", { type: "tel", placeholder: "+234 803 123 4567" })}
          {text("email", "Email", { type: "email" })}
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-5">
        <h3 className="text-small font-semibold tracking-wide text-muted-foreground uppercase">
          Terms
        </h3>
        <div>
          <div className="grid grid-cols-2 gap-4">
            {rateInput("rate_min_monthly", "Lowest rate")}
            {rateInput("rate_max_monthly", "Highest rate")}
          </div>
          <p className="mt-1.5 text-small text-muted-foreground">Typical interest, per month.</p>
        </div>
        <Field
          label="Facility types offered"
          htmlFor="fin-facilities"
          hint={facilityOptions.length === 0 ? "Add facility types in Settings first." : undefined}
          error={errors.facility_types?.message}
        >
          <Controller
            control={form.control}
            name="facility_types"
            render={({ field }) => (
              <ToggleChips
                id="fin-facilities"
                label="Facility types offered"
                options={facilityOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Field>
        <Field
          label="Collateral policy"
          htmlFor="fin-collateral"
          error={errors.collateral_policy?.message}
        >
          <Textarea
            id="fin-collateral"
            rows={3}
            placeholder="e.g. Legal mortgage or debenture at 150% cover"
            {...form.register("collateral_policy")}
            aria-invalid={errors.collateral_policy ? true : undefined}
            aria-describedby="fin-collateral-error"
          />
        </Field>
        <Field label="Notes" htmlFor="fin-notes" error={errors.notes?.message}>
          <Textarea
            id="fin-notes"
            rows={3}
            {...form.register("notes")}
            aria-invalid={errors.notes ? true : undefined}
            aria-describedby="fin-notes-error"
          />
        </Field>
      </div>
    </FormSheet>
  );
}
