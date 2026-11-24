"use client";

import { PlusIcon } from "lucide-react";
import { Controller } from "react-hook-form";
import type * as React from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { createDeal } from "@/features/deals/actions";
import type { DealFormOptions } from "@/features/deals/queries";
import { newDealSchema } from "@/features/deals/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";

const noneValue = "__none__";

export function NewDealSheet({ options }: { options: DealFormOptions }) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: newDealSchema,
    defaultValues: {
      client_id: "",
      financier_id: "",
      facility_type_id: "",
      amount_requested: "",
      amount_approved: "",
      tenor_months: "",
      interest_rate_monthly: "",
      purpose: "",
      collateral_type: "",
      collateral_value: "",
      guarantor_name: "",
      guarantor_cheques: "no",
      other_fees_note: "",
      referrer_id: "",
      referral_fee_basis: "none",
      referral_fee_value: "",
    },
    action: createDeal,
    successMessage: "Deal opened",
  });
  const { errors } = form.formState;
  const feeBasis = form.watch("referral_fee_basis");

  const error = (name: keyof typeof errors) => {
    const message = errors[name]?.message;
    return typeof message === "string" ? message : undefined;
  };

  const select = (
    name: "client_id" | "financier_id" | "facility_type_id" | "referrer_id",
    id: string,
    label: string,
    items: { id: string; name?: string; display_name?: string }[],
    placeholder: string,
    required = false,
  ) => (
    <Field label={label} htmlFor={id} required={required} error={error(name)}>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value || (required ? undefined : noneValue)}
            onValueChange={(value) => field.onChange(value === noneValue ? "" : value)}
          >
            <SelectTrigger id={id} className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {!required && <SelectItem value={noneValue}>Not set</SelectItem>}
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name ?? item.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  );

  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button>
          <PlusIcon /> New deal
        </Button>
      }
      title="New deal"
      description="Open a deal and start with a copy of the selected financier's requirement checklist."
      submitLabel="Open deal"
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <div className="space-y-4">
        <h3 className="text-small font-semibold tracking-wide text-muted-foreground uppercase">
          Placement
        </h3>
        {select("client_id", "deal-client", "Client", options.clients, "Choose a client", true)}
        {select(
          "financier_id",
          "deal-financier",
          "Financier",
          options.financiers,
          "Choose a financier",
          true,
        )}
        {select(
          "facility_type_id",
          "deal-facility",
          "Facility",
          options.facilityTypes,
          "Choose a facility",
          true,
        )}
      </div>

      <div className="space-y-4 border-t border-border pt-5">
        <h3 className="text-small font-semibold tracking-wide text-muted-foreground uppercase">
          Request
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Amount requested"
            htmlFor="deal-amount-requested"
            required
            error={error("amount_requested")}
          >
            <Input
              id="deal-amount-requested"
              inputMode="decimal"
              placeholder="e.g. 25000000"
              className="num"
              {...form.register("amount_requested")}
            />
          </Field>
          <Field
            label="Amount approved"
            htmlFor="deal-amount-approved"
            error={error("amount_approved")}
          >
            <Input
              id="deal-amount-approved"
              inputMode="decimal"
              placeholder="Optional"
              className="num"
              {...form.register("amount_approved")}
            />
          </Field>
          <Field label="Tenor (months)" htmlFor="deal-tenor" error={error("tenor_months")}>
            <Input
              id="deal-tenor"
              inputMode="numeric"
              placeholder="e.g. 12"
              className="num"
              {...form.register("tenor_months")}
            />
          </Field>
          <Field
            label="Interest rate / month"
            htmlFor="deal-rate"
            error={error("interest_rate_monthly")}
          >
            <div className="relative">
              <Input
                id="deal-rate"
                inputMode="decimal"
                placeholder="e.g. 2.5"
                className="pr-8 text-right num"
                {...form.register("interest_rate_monthly")}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-small text-muted-foreground">
                %
              </span>
            </div>
          </Field>
        </div>
        <Field label="Purpose" htmlFor="deal-purpose" error={error("purpose")}>
          <Textarea
            id="deal-purpose"
            rows={3}
            placeholder="What is the facility for?"
            {...form.register("purpose")}
          />
        </Field>
      </div>

      <div className="space-y-4 border-t border-border pt-5">
        <h3 className="text-small font-semibold tracking-wide text-muted-foreground uppercase">
          Security & fees
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Collateral" htmlFor="deal-collateral" error={error("collateral_type")}>
            <Input
              id="deal-collateral"
              placeholder="e.g. Property, invoice"
              {...form.register("collateral_type")}
            />
          </Field>
          <Field
            label="Collateral value"
            htmlFor="deal-collateral-value"
            error={error("collateral_value")}
          >
            <Input
              id="deal-collateral-value"
              inputMode="decimal"
              placeholder="Optional"
              className="num"
              {...form.register("collateral_value")}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Guarantor" htmlFor="deal-guarantor" error={error("guarantor_name")}>
            <Input
              id="deal-guarantor"
              placeholder="Optional"
              {...form.register("guarantor_name")}
            />
          </Field>
          <Field
            label="Guarantor cheques"
            htmlFor="deal-cheques"
            error={error("guarantor_cheques")}
          >
            <Controller
              control={form.control}
              name="guarantor_cheques"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="deal-cheques" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Not provided</SelectItem>
                    <SelectItem value="yes">Provided</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
        <Field label="Other fees" htmlFor="deal-fees" error={error("other_fees_note")}>
          <Textarea
            id="deal-fees"
            rows={2}
            placeholder="Processing, legal or other fee notes"
            {...form.register("other_fees_note")}
          />
        </Field>
      </div>

      <div className="space-y-4 border-t border-border pt-5">
        <h3 className="text-small font-semibold tracking-wide text-muted-foreground uppercase">
          Referral
        </h3>
        {select("referrer_id", "deal-referrer", "Referrer", options.referrers, "Optional")}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Referral fee basis"
            htmlFor="deal-fee-basis"
            error={error("referral_fee_basis")}
          >
            <Controller
              control={form.control}
              name="referral_fee_basis"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="deal-fee-basis" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No fee</SelectItem>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="flat">Flat amount</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field
            label={feeBasis === "percent" ? "Referral fee %" : "Referral fee"}
            htmlFor="deal-fee-value"
            error={error("referral_fee_value")}
          >
            <Input
              id="deal-fee-value"
              inputMode="decimal"
              disabled={feeBasis === "none"}
              placeholder={feeBasis === "percent" ? "e.g. 10" : "Optional"}
              className="num"
              {...form.register("referral_fee_value")}
            />
          </Field>
        </div>
      </div>
    </FormSheet>
  );
}
