"use client";

import { PencilIcon } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";

import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveFeeDefaults } from "@/features/settings/actions/general-actions";
import { feeDefaultsSchema } from "@/features/settings/schemas";
import { type FeeValues, referralTriggerLabel } from "@/features/settings/settings-values";
import { useSheetForm } from "@/hooks/use-sheet-form";

type PercentField = "client_fee_pct" | "provider_commission_pct" | "vat_rate_pct" | "wht_rate_pct";

export function FeesSheet({ values }: { values: FeeValues }) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: feeDefaultsSchema,
    defaultValues: {
      client_fee_pct: String(values.fee_defaults.client_fee_pct),
      provider_commission_pct: String(values.fee_defaults.provider_commission_pct),
      collateral_fee_basis: values.fee_defaults.collateral_fee.basis,
      collateral_fee_value: String(values.fee_defaults.collateral_fee.value),
      vat_rate_pct: String(values.vat_rate_pct),
      wht_rate_pct: String(values.wht_rate_pct),
      referral_fee_trigger: values.referral_fee_trigger,
    },
    action: saveFeeDefaults,
    successMessage: "Fee defaults saved",
  });
  const { errors } = form.formState;
  const basis = useWatch({ control: form.control, name: "collateral_fee_basis" });

  const percentInput = (name: PercentField, id: string) => (
    <div className="relative">
      <Input
        id={id}
        inputMode="decimal"
        className="pr-8 text-right num"
        {...form.register(name)}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={`${id}-hint ${id}-error`}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-small text-muted-foreground">
        %
      </span>
    </div>
  );

  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="outline">
          <PencilIcon /> Edit defaults
        </Button>
      }
      title="Fee defaults"
      description="Pre-filled on every new deal. Changing them doesn't touch deals that already exist."
      submitLabel="Save defaults"
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <div className="space-y-4">
        <h3 className="text-small font-semibold tracking-wide text-muted-foreground uppercase">
          P&T fees
        </h3>
        <Field
          label="Client fee"
          htmlFor="fee-client"
          required
          hint="% of the facility amount, charged to the client."
          error={errors.client_fee_pct?.message}
        >
          {percentInput("client_fee_pct", "fee-client")}
        </Field>
        <Field
          label="Provider commission"
          htmlFor="fee-provider"
          required
          hint="% of the facility amount, paid to P&T by the finance house."
          error={errors.provider_commission_pct?.message}
        >
          {percentInput("provider_commission_pct", "fee-provider")}
        </Field>
        <Field
          label="Collateral fee"
          htmlFor="fee-collateral"
          required
          hint={basis === "percent" ? "% of the facility amount." : "A fixed amount in naira."}
          error={errors.collateral_fee_value?.message}
        >
          <div className="flex gap-2">
            <Controller
              control={form.control}
              name="collateral_fee_basis"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-36 shrink-0" aria-label="Collateral fee basis">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="flat">Flat amount</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <div className="relative flex-1">
              {basis === "flat" && (
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-small text-muted-foreground">
                  ₦
                </span>
              )}
              <Input
                id="fee-collateral"
                inputMode="decimal"
                className={basis === "flat" ? "pl-7 text-right num" : "pr-8 text-right num"}
                {...form.register("collateral_fee_value")}
                aria-invalid={errors.collateral_fee_value ? true : undefined}
                aria-describedby="fee-collateral-hint fee-collateral-error"
              />
              {basis === "percent" && (
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-small text-muted-foreground">
                  %
                </span>
              )}
            </div>
          </div>
        </Field>
        <Field label="Referral fees are earned" htmlFor="fee-referral" required>
          <Controller
            control={form.control}
            name="referral_fee_trigger"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="fee-referral" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(referralTriggerLabel) as (keyof typeof referralTriggerLabel)[]).map(
                    (k) => (
                      <SelectItem key={k} value={k}>
                        {referralTriggerLabel[k]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <div className="space-y-4 border-t border-border pt-5">
        <h3 className="text-small font-semibold tracking-wide text-muted-foreground uppercase">
          Tax
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="VAT"
            htmlFor="fee-vat"
            required
            hint="Added to P&T's invoices."
            error={errors.vat_rate_pct?.message}
          >
            {percentInput("vat_rate_pct", "fee-vat")}
          </Field>
          <Field
            label="WHT"
            htmlFor="fee-wht"
            required
            hint="Withheld by payers."
            error={errors.wht_rate_pct?.message}
          >
            {percentInput("wht_rate_pct", "fee-wht")}
          </Field>
        </div>
      </div>
    </FormSheet>
  );
}
