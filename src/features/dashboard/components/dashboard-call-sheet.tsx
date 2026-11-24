"use client";

import { PhoneCallIcon } from "lucide-react";

import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logDashboardCall } from "@/features/dashboard/actions";
import { callLogSchema } from "@/features/follow-ups/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";

export function DashboardCallSheet({
  scheduleId,
  dealId,
  clientName,
  reference,
}: {
  scheduleId: string;
  dealId: string;
  clientName: string;
  reference: string;
}) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: callLogSchema,
    defaultValues: { outcome: "", promise_to_pay_date: "" },
    action: (values) => logDashboardCall(scheduleId, dealId, values),
    successMessage: "Call logged",
  });
  const { errors } = form.formState;
  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="sm" variant="outline">
          <PhoneCallIcon /> Log call
        </Button>
      }
      title="Log call"
      description={`${clientName} · ${reference}`}
      submitLabel="Save call outcome"
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field
        label="Outcome"
        htmlFor={`dashboard-call-outcome-${scheduleId}`}
        required
        error={typeof errors.outcome?.message === "string" ? errors.outcome.message : undefined}
      >
        <Input
          id={`dashboard-call-outcome-${scheduleId}`}
          autoFocus
          placeholder="e.g. Client promised payment after invoice clears"
          {...form.register("outcome")}
        />
      </Field>
      <Field
        label="Promise-to-pay date"
        htmlFor={`dashboard-call-promise-${scheduleId}`}
        error={
          typeof errors.promise_to_pay_date?.message === "string"
            ? errors.promise_to_pay_date.message
            : undefined
        }
      >
        <Input
          id={`dashboard-call-promise-${scheduleId}`}
          type="date"
          {...form.register("promise_to_pay_date")}
        />
      </Field>
    </FormSheet>
  );
}
