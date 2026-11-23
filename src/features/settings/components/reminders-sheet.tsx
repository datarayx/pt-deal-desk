"use client";

import { PencilIcon } from "lucide-react";
import { Controller } from "react-hook-form";

import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { ToggleChips } from "@/components/common/toggle-chips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveReminderSettings } from "@/features/settings/actions/general-actions";
import { reminderSettingsSchema, WEEKDAYS } from "@/features/settings/schemas";
import {
  REMINDER_DAY_CHOICES,
  reminderDayLabel,
  type ReminderValues,
  weekdayLabel,
} from "@/features/settings/settings-values";
import { useSheetForm } from "@/hooks/use-sheet-form";

const dayOptions = REMINDER_DAY_CHOICES.map((d) => ({
  value: d as number,
  label: reminderDayLabel(d),
}));
const weekdayOptions = WEEKDAYS.map((d) => ({ value: d, label: weekdayLabel[d].slice(0, 3) }));

export function RemindersSheet({ values }: { values: ReminderValues }) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: reminderSettingsSchema,
    defaultValues: {
      reminder_days_before_due: values.reminder_days_before_due,
      overdue_email_weekdays: values.overdue_email_weekdays,
      stale_deal_days: String(values.stale_deal_days),
    },
    action: saveReminderSettings,
    successMessage: "Reminder timings saved",
  });
  const { errors } = form.formState;

  // Keep any custom day already stored (e.g. 21) selectable alongside the standard choices.
  const options = [
    ...dayOptions,
    ...values.reminder_days_before_due
      .filter((d) => !dayOptions.some((o) => o.value === d))
      .map((d) => ({ value: d, label: reminderDayLabel(d) })),
  ].sort((a, b) => b.value - a.value);

  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="outline">
          <PencilIcon /> Edit timings
        </Button>
      }
      title="Reminder timings"
      description="When the daily job emails recipients. Times run on Africa/Lagos time."
      submitLabel="Save timings"
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field
        label="Remind before a repayment is due"
        htmlFor="reminder-days"
        required
        hint="Pick up to six."
        error={errors.reminder_days_before_due?.message}
      >
        <Controller
          control={form.control}
          name="reminder_days_before_due"
          render={({ field }) => (
            <ToggleChips
              id="reminder-days"
              label="Reminder days before due"
              options={options}
              value={field.value}
              onChange={field.onChange}
              describedBy="reminder-days-hint reminder-days-error"
            />
          )}
        />
      </Field>

      <Field
        label="Send overdue summaries on"
        htmlFor="overdue-days"
        required
        hint="A digest of every overdue repayment, on these weekdays."
        error={errors.overdue_email_weekdays?.message}
      >
        <Controller
          control={form.control}
          name="overdue_email_weekdays"
          render={({ field }) => (
            <ToggleChips
              id="overdue-days"
              label="Overdue summary weekdays"
              describedBy="overdue-days-hint overdue-days-error"
              options={weekdayOptions}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </Field>

      <Field
        label="Flag a deal as stale after"
        htmlFor="stale-days"
        required
        hint="Days without a stage change. Between 7 and 180."
        error={errors.stale_deal_days?.message}
      >
        <div className="flex items-center gap-2">
          <Input
            id="stale-days"
            inputMode="numeric"
            className="w-24 text-right num"
            {...form.register("stale_deal_days")}
            aria-invalid={errors.stale_deal_days ? true : undefined}
            aria-describedby="stale-days-error"
          />
          <span className="text-body text-muted-foreground">days</span>
        </div>
      </Field>
    </FormSheet>
  );
}
