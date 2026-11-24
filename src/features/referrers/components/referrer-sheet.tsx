"use client";

import { useRouter } from "next/navigation";
import type * as React from "react";
import { Controller, useWatch } from "react-hook-form";

import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveReferrer } from "@/features/referrers/actions";
import type { ReferrerDetail } from "@/features/referrers/queries";
import { REFERRER_TYPES, referrerSchema, referrerTypeLabel } from "@/features/referrers/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";

const sectionTitle = "text-small font-semibold tracking-wide text-muted-foreground uppercase";

export function ReferrerSheet({
  referrer,
  trigger,
}: {
  referrer?: ReferrerDetail;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: referrerSchema,
    defaultValues: {
      name: referrer?.name ?? "",
      referrer_type: referrer?.referrer_type ?? "consultant",
      contact_person: referrer?.contact_person ?? "",
      phone: referrer?.phone ?? "",
      email: referrer?.email ?? "",
      default_fee_type: referrer?.default_fee_type ?? "none",
      // numeric(18,4) comes back as e.g. "1.5000"; show it without the padding.
      default_fee_value: referrer?.default_fee_value
        ? referrer.default_fee_value.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")
        : "",
      bank_name: referrer?.bank_name ?? "",
      account_name: referrer?.account_name ?? "",
    },
    action: (values) => saveReferrer(referrer?.id ?? null, values),
    successMessage: referrer ? "Referrer updated" : "Referrer added",
    onSuccess: (data) => {
      if (!referrer && data) router.push(`/referrers/${data.id}`);
    },
  });
  const { errors } = form.formState;
  const feeType = useWatch({ control: form.control, name: "default_fee_type" });

  const text = (
    name: "name" | "contact_person" | "phone" | "email" | "bank_name" | "account_name",
    label: string,
    opts: { required?: boolean; type?: string; placeholder?: string; autoFocus?: boolean } = {},
  ) => (
    <Field
      label={label}
      htmlFor={`ref-${name}`}
      required={opts.required}
      error={errors[name]?.message}
    >
      <Input
        id={`ref-${name}`}
        type={opts.type ?? "text"}
        placeholder={opts.placeholder}
        autoFocus={opts.autoFocus}
        autoComplete="off"
        {...form.register(name)}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={`ref-${name}-error`}
      />
    </Field>
  );

  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={referrer ? `Edit ${referrer.name}` : "Add a referrer"}
      description="A person or firm who introduces clients to P&T and may earn a referral fee."
      submitLabel={referrer ? "Save referrer" : "Add referrer"}
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      {text("name", "Name", {
        required: true,
        autoFocus: true,
        placeholder: "Person or firm name",
      })}
      <Field label="Type" htmlFor="ref-type" required>
        <Controller
          control={form.control}
          name="referrer_type"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="ref-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFERRER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {referrerTypeLabel[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <div className="space-y-4 border-t border-border pt-5">
        <h3 className={sectionTitle}>Contact</h3>
        {text("contact_person", "Contact person")}
        <div className="grid gap-4 sm:grid-cols-2">
          {text("phone", "Phone", { type: "tel", placeholder: "+234 803 123 4567" })}
          {text("email", "Email", { type: "email" })}
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-5">
        <h3 className={sectionTitle}>Referral fee</h3>
        <Field
          label="Usual fee"
          htmlFor="ref-fee-value"
          hint="Pre-filled on new deals they refer; the fee agreed on each deal is what counts."
          error={errors.default_fee_value?.message}
        >
          <div className="flex gap-2">
            <Controller
              control={form.control}
              name="default_fee_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-36 shrink-0" aria-label="Fee basis">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No usual fee</SelectItem>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="flat">Flat amount</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {feeType !== "none" && (
              <div className="relative flex-1">
                {feeType === "flat" && (
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-small text-muted-foreground">
                    ₦
                  </span>
                )}
                <Input
                  id="ref-fee-value"
                  inputMode="decimal"
                  className={feeType === "flat" ? "pl-7 text-right num" : "pr-8 text-right num"}
                  {...form.register("default_fee_value")}
                  aria-invalid={errors.default_fee_value ? true : undefined}
                  aria-describedby="ref-fee-value-hint ref-fee-value-error"
                />
                {feeType === "percent" && (
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-small text-muted-foreground">
                    %
                  </span>
                )}
              </div>
            )}
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("bank_name", "Bank")}
          {text("account_name", "Account name")}
        </div>
        <p className="text-small text-muted-foreground">
          Bank and account name are shown to the accountant when paying referral fees.
        </p>
      </div>
    </FormSheet>
  );
}
