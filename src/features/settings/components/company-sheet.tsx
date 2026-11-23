"use client";

import { PencilIcon } from "lucide-react";

import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveCompanyProfile } from "@/features/settings/actions/general-actions";
import { companyProfileSchema } from "@/features/settings/schemas";
import type { CompanyValues } from "@/features/settings/settings-values";
import { useSheetForm } from "@/hooks/use-sheet-form";

const fields = [
  { name: "rc_number", label: "CAC registration number", placeholder: "RC 1234567" },
  { name: "tin", label: "Tax ID (TIN)", placeholder: "12345678-0001" },
  { name: "phone", label: "Phone", placeholder: "+234 803 123 4567", type: "tel" },
  { name: "email", label: "Email", placeholder: "hello@example.ng", type: "email" },
  { name: "website", label: "Website", placeholder: "www.example.ng" },
] as const;

export function CompanySheet({ values }: { values: CompanyValues }) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: companyProfileSchema,
    defaultValues: {
      name: values.name,
      rc_number: values.rc_number ?? "",
      tin: values.tin ?? "",
      address: values.address ?? "",
      phone: values.phone ?? "",
      email: values.email ?? "",
      website: values.website ?? "",
    },
    action: saveCompanyProfile,
    successMessage: "Company profile saved",
  });
  const { errors } = form.formState;

  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="outline">
          <PencilIcon /> Edit profile
        </Button>
      }
      title="Company profile"
      description="Shown on invoices, statements and exported reports."
      submitLabel="Save profile"
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field label="Company name" htmlFor="company-name" required error={errors.name?.message}>
        <Input
          id="company-name"
          autoFocus
          {...form.register("name")}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby="company-name-error"
        />
      </Field>
      {fields.map((f) => (
        <Field
          key={f.name}
          label={f.label}
          htmlFor={`company-${f.name}`}
          error={errors[f.name]?.message}
        >
          <Input
            id={`company-${f.name}`}
            type={"type" in f ? f.type : "text"}
            placeholder={f.placeholder}
            {...form.register(f.name)}
            aria-invalid={errors[f.name] ? true : undefined}
            aria-describedby={`company-${f.name}-error`}
          />
        </Field>
      ))}
      <Field label="Address" htmlFor="company-address" error={errors.address?.message}>
        <Textarea
          id="company-address"
          rows={3}
          {...form.register("address")}
          aria-invalid={errors.address ? true : undefined}
          aria-describedby="company-address-error"
        />
      </Field>
    </FormSheet>
  );
}
