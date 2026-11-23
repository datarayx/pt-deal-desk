"use client";

import type * as React from "react";

import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { Input } from "@/components/ui/input";
import { saveFacilityType } from "@/features/settings/actions/facility-type-actions";
import type { FacilityTypeRow } from "@/features/settings/queries";
import { facilityTypeSchema } from "@/features/settings/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";

export function FacilityTypeSheet({
  facilityType,
  trigger,
}: {
  facilityType?: FacilityTypeRow;
  trigger: React.ReactNode;
}) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: facilityTypeSchema,
    defaultValues: { name: facilityType?.name ?? "" },
    action: (values) => saveFacilityType(facilityType?.id ?? null, values),
    successMessage: facilityType ? "Facility type updated" : "Facility type added",
  });
  const { errors } = form.formState;

  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={facilityType ? `Edit “${facilityType.name}”` : "Add a facility type"}
      description="The kinds of funding P&T arranges, e.g. LPO financing or asset financing."
      submitLabel={facilityType ? "Save" : "Add facility type"}
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field label="Name" htmlFor="facility-name" required error={errors.name?.message}>
        <Input
          id="facility-name"
          autoFocus
          {...form.register("name")}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby="facility-name-error"
        />
      </Field>
    </FormSheet>
  );
}
