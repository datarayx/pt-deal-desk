"use client";

import type * as React from "react";
import { Controller } from "react-hook-form";

import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveRequirement } from "@/features/financiers/actions";
import type { RequirementRow } from "@/features/financiers/queries";
import { requirementSchema } from "@/features/financiers/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";

export function RequirementSheet({
  financierId,
  financierName,
  requirement,
  trigger,
}: {
  financierId: string;
  financierName: string;
  requirement?: RequirementRow;
  trigger: React.ReactNode;
}) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: requirementSchema,
    defaultValues: { item: requirement?.item ?? "", is_required: requirement?.is_required ?? true },
    action: (values) => saveRequirement(financierId, requirement?.id ?? null, values),
    successMessage: requirement ? "Requirement updated" : "Requirement added",
  });
  const { errors } = form.formState;

  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={requirement ? "Edit requirement" : "Add a requirement"}
      description={`Part of ${financierName}'s checklist. New deals with them start with a copy of it.`}
      submitLabel={requirement ? "Save requirement" : "Add requirement"}
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field label="Requirement" htmlFor="req-item" required error={errors.item?.message}>
        <Input
          id="req-item"
          autoFocus
          placeholder="e.g. 12 months' bank statements"
          {...form.register("item")}
          aria-invalid={errors.item ? true : undefined}
          aria-describedby="req-item-error"
        />
      </Field>
      <Controller
        control={form.control}
        name="is_required"
        render={({ field }) => (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <label htmlFor="req-required" className="text-small font-medium">
                Required
              </label>
              <p className="text-small text-muted-foreground">
                Missing required items show as deficiencies on the deal.
              </p>
            </div>
            <Switch id="req-required" checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />
    </FormSheet>
  );
}
