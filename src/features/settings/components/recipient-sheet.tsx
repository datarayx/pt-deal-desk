"use client";

import type * as React from "react";
import { Controller } from "react-hook-form";

import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveRecipient } from "@/features/settings/actions/recipient-actions";
import type { RecipientRow } from "@/features/settings/queries";
import { ALERT_TYPES, alertTypeLabel, recipientSchema } from "@/features/settings/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";

const alertHint: Record<(typeof ALERT_TYPES)[number], string> = {
  due_soon: "Repayments coming up, on the reminder days you set",
  due_today: "Repayments due today",
  overdue: "Unpaid repayments past their due date",
  stale_deal: "Deals that haven't moved stage in a while",
};

export function RecipientSheet({
  recipient,
  trigger,
}: {
  recipient?: RecipientRow;
  trigger: React.ReactNode;
}) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: recipientSchema,
    defaultValues: {
      name: recipient?.name ?? "",
      title: recipient?.title ?? "",
      email: recipient?.email ?? "",
      alert_types: recipient?.alert_types ?? ["due_soon", "due_today", "overdue"],
      is_active: recipient?.is_active ?? true,
    },
    action: (values) => saveRecipient(recipient?.id ?? null, values),
    successMessage: recipient ? "Recipient updated" : "Recipient added",
  });
  const { errors } = form.formState;

  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={recipient ? `Edit ${recipient.name}` : "Add a recipient"}
      description="Who gets P&T's alert emails. In the demo, emails go to the in-app Outbox instead of being sent."
      submitLabel={recipient ? "Save recipient" : "Add recipient"}
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field label="Name" htmlFor="recipient-name" required error={errors.name?.message}>
        <Input
          id="recipient-name"
          autoFocus
          {...form.register("name")}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby="recipient-name-error"
        />
      </Field>
      <Field
        label="Job title"
        htmlFor="recipient-title"
        hint="Optional"
        error={errors.title?.message}
      >
        <Input
          id="recipient-title"
          placeholder="e.g. Head of Operations"
          {...form.register("title")}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby="recipient-title-error"
        />
      </Field>
      <Field label="Email" htmlFor="recipient-email" required error={errors.email?.message}>
        <Input
          id="recipient-email"
          type="email"
          autoComplete="off"
          {...form.register("email")}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby="recipient-email-error"
        />
      </Field>

      <Controller
        control={form.control}
        name="alert_types"
        render={({ field }) => (
          <fieldset className="space-y-2" aria-describedby="recipient-alerts-error">
            <legend className="mb-2 text-small font-medium">
              Alerts they receive <span className="text-danger">*</span>
            </legend>
            {ALERT_TYPES.map((type) => {
              const checked = field.value.includes(type);
              return (
                <label
                  key={type}
                  htmlFor={`alert-${type}`}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-accent/60 has-[:checked]:bg-accent-soft/40"
                >
                  <Checkbox
                    id={`alert-${type}`}
                    className="mt-0.5"
                    checked={checked}
                    onCheckedChange={(next) =>
                      field.onChange(
                        next === true
                          ? ALERT_TYPES.filter((t) => t === type || field.value.includes(t))
                          : field.value.filter((t) => t !== type),
                      )
                    }
                  />
                  <span className="space-y-0.5">
                    <span className="block text-small font-medium">{alertTypeLabel[type]}</span>
                    <span className="block text-small text-muted-foreground">
                      {alertHint[type]}
                    </span>
                  </span>
                </label>
              );
            })}
            {errors.alert_types && (
              <p id="recipient-alerts-error" className="text-small text-danger">
                {errors.alert_types.message}
              </p>
            )}
          </fieldset>
        )}
      />

      <Controller
        control={form.control}
        name="is_active"
        render={({ field }) => (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <label htmlFor="recipient-active" className="text-small font-medium">
                Active
              </label>
              <p className="text-small text-muted-foreground">Paused recipients get no emails.</p>
            </div>
            <Switch id="recipient-active" checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />
    </FormSheet>
  );
}
