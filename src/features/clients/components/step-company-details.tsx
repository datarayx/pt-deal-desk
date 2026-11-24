"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, type Resolver, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Field } from "@/components/common/field";
import { SelectInput } from "@/components/common/select-input";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldSection } from "@/features/clients/components/field-section";
import { SectorNotesFields } from "@/features/clients/components/sector-notes-fields";
import { StepFrame } from "@/features/clients/components/step-frame";
import { COMPANY_TYPES, companyTypeLabel, TURNOVER_RANGES } from "@/features/clients/options";
import { companySchema } from "@/features/clients/schemas";
import type { CompanyInput } from "@/features/clients/wizard-draft";
import { CAC_PREFIX, lagosToday, optionalText } from "@/lib/validation";

const schema = z.object({
  company: companySchema,
  sector: optionalText(120),
  notes: optionalText(2000),
});
type Values = { company: CompanyInput; sector: string; notes: string };
type Key = Exclude<keyof CompanyInput, "company_type">;

export function StepCompanyDetails({
  defaultValues,
  onNext,
  onBack,
}: {
  defaultValues: Values;
  onNext: (values: Values) => void;
  /** Going back keeps what was typed, without validating it. */
  onBack: (values: Values) => void;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(schema as never) as unknown as Resolver<Values>,
    defaultValues,
    mode: "onTouched",
  });
  const errors = form.formState.errors.company;
  const companyType = useWatch({ control: form.control, name: "company.company_type" });
  const prefix = CAC_PREFIX[companyType];

  const text = (
    name: Key,
    label: string,
    opts: {
      required?: boolean;
      type?: string;
      placeholder?: string;
      hint?: string;
      autoFocus?: boolean;
      inputMode?: "tel" | "email" | "url";
    } = {},
  ) => {
    const id = `company-${name}`;
    return (
      <Field
        label={label}
        htmlFor={id}
        required={opts.required}
        hint={opts.hint}
        error={errors?.[name]?.message}
      >
        <Input
          id={id}
          type={opts.type ?? "text"}
          inputMode={opts.inputMode}
          placeholder={opts.placeholder}
          autoFocus={opts.autoFocus}
          autoComplete="off"
          max={opts.type === "date" ? lagosToday() : undefined}
          {...form.register(`company.${name}`)}
          aria-invalid={errors?.[name] ? true : undefined}
          aria-describedby={`${id}-hint ${id}-error`}
        />
      </Field>
    );
  };

  const address = (
    name: "registered_address" | "operating_address",
    label: string,
    required: boolean,
    hint?: string,
  ) => (
    <Field
      label={label}
      htmlFor={`company-${name}`}
      required={required}
      hint={hint}
      error={errors?.[name]?.message}
    >
      <Textarea
        id={`company-${name}`}
        rows={2}
        {...form.register(`company.${name}`)}
        aria-invalid={errors?.[name] ? true : undefined}
        aria-describedby={`company-${name}-hint company-${name}-error`}
      />
    </Field>
  );

  return (
    <StepFrame
      title="Company details"
      description="As registered with the Corporate Affairs Commission (CAC). Fields marked * are required."
      onSubmit={form.handleSubmit(() => onNext(form.getValues()))}
      onBack={() => onBack(form.getValues())}
    >
      <FieldSection title="Registration">
        {text("registered_name", "Registered name", {
          required: true,
          autoFocus: true,
          placeholder: "e.g. Zuma Rock Minerals Ltd",
        })}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company type" htmlFor="company-type" required>
            <Controller
              control={form.control}
              name="company.company_type"
              render={({ field }) => (
                <SelectInput
                  id="company-type"
                  value={field.value}
                  onChange={field.onChange}
                  options={COMPANY_TYPES.map((t) => ({ value: t, label: companyTypeLabel[t] }))}
                />
              )}
            />
          </Field>
          {text("rc_number", "CAC number", {
            required: true,
            placeholder: `${prefix} 1234567`,
            hint: `Starts with ${prefix} for this company type.`,
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {text("incorporation_date", "Date of incorporation", { type: "date" })}
          {text("tin", "Tax ID (TIN)", { placeholder: "12345678-0001" })}
          <Field label="Annual turnover" htmlFor="company-turnover">
            <Controller
              control={form.control}
              name="company.annual_turnover_range"
              render={({ field }) => (
                <SelectInput
                  id="company-turnover"
                  value={field.value}
                  onChange={field.onChange}
                  options={TURNOVER_RANGES}
                />
              )}
            />
          </Field>
        </div>
      </FieldSection>

      <FieldSection title="Addresses">
        <div className="grid gap-4 sm:grid-cols-2">
          {address("registered_address", "Registered address", true)}
          {address(
            "operating_address",
            "Operating address",
            false,
            "If different from the registered address.",
          )}
        </div>
      </FieldSection>

      <FieldSection title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          {text("contact_person", "Contact person", { required: true })}
          {text("contact_phone", "Contact phone", {
            required: true,
            type: "tel",
            inputMode: "tel",
            placeholder: "+234 803 123 4567",
          })}
          {text("contact_email", "Contact email", { type: "email", inputMode: "email" })}
          {text("website", "Website", { inputMode: "url", placeholder: "www.example.ng" })}
        </div>
      </FieldSection>

      <SectorNotesFields form={form} />
    </StepFrame>
  );
}
