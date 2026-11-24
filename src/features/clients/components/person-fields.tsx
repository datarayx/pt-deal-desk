"use client";

import type * as React from "react";
import {
  Controller,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";

import { Field } from "@/components/common/field";
import { SelectInput } from "@/components/common/select-input";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FieldSection } from "@/features/clients/components/field-section";
import {
  genderLabel,
  GENDERS,
  ID_TYPES,
  INCOME_RANGES,
  NIGERIAN_STATES,
  TITLES,
} from "@/features/clients/options";
import type { PersonInput } from "@/features/clients/wizard-draft";
import { lagosToday } from "@/lib/validation";

type PersonForm = { profile: PersonInput } & FieldValues;
type TextKey = Exclude<keyof PersonInput, "id" | "is_pep">;

/**
 * Fields for one person under `profile.*`. "client" = the individual client (full KYC/CIS);
 * "director" = a company director or shareholder (identity, contact, address).
 */
export function PersonFields<T extends PersonForm>({
  form,
  variant,
  idPrefix,
  onIdentityBlur,
  identityNote,
}: {
  form: UseFormReturn<T>;
  variant: "client" | "director";
  idPrefix: string;
  /** Called when BVN or NIN loses focus (director lookup). */
  onIdentityBlur?: () => void;
  identityNote?: React.ReactNode;
}) {
  const errors = (form.formState.errors as FieldErrors<{ profile: PersonInput }>).profile;
  const path = (name: keyof PersonInput) => `profile.${name}` as Path<T>;
  const isClient = variant === "client";
  const today = lagosToday();

  const text = (
    name: TextKey,
    label: string,
    opts: {
      required?: boolean;
      type?: string;
      placeholder?: string;
      inputMode?: "numeric" | "tel" | "email";
      hint?: string;
      autoFocus?: boolean;
      max?: string;
      onBlur?: () => void;
      className?: string;
    } = {},
  ) => {
    const id = `${idPrefix}-${name}`;
    const reg = form.register(path(name));
    return (
      <Field
        label={label}
        htmlFor={id}
        required={opts.required}
        hint={opts.hint}
        error={errors?.[name]?.message}
        className={opts.className}
      >
        <Input
          id={id}
          type={opts.type ?? "text"}
          inputMode={opts.inputMode}
          placeholder={opts.placeholder}
          autoFocus={opts.autoFocus}
          autoComplete="off"
          max={opts.max}
          className={opts.inputMode === "numeric" ? "num tracking-wider" : undefined}
          {...reg}
          onBlur={(e) => {
            void reg.onBlur(e);
            opts.onBlur?.();
          }}
          aria-invalid={errors?.[name] ? true : undefined}
          aria-describedby={`${id}-hint ${id}-error`}
        />
      </Field>
    );
  };

  const select = (
    name: TextKey,
    label: string,
    options: readonly (string | { value: string; label: string })[],
    required = false,
  ) => {
    const id = `${idPrefix}-${name}`;
    return (
      <Field label={label} htmlFor={id} required={required} error={errors?.[name]?.message}>
        <Controller
          control={form.control}
          name={path(name)}
          render={({ field }) => (
            <SelectInput
              id={id}
              value={String(field.value ?? "")}
              onChange={field.onChange}
              options={options}
              invalid={!!errors?.[name]}
              describedBy={`${id}-error`}
            />
          )}
        />
      </Field>
    );
  };

  return (
    <>
      <FieldSection title="Name">
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr_1fr]">
          {select("title", "Title", TITLES)}
          {text("first_name", "First name", { required: true, autoFocus: true })}
          {text("last_name", "Surname", { required: true })}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {text("middle_name", "Middle name")}
          {select(
            "gender",
            "Gender",
            GENDERS.map((g) => ({ value: g, label: genderLabel[g] })),
          )}
          {text("date_of_birth", "Date of birth", { type: "date", required: isClient, max: today })}
        </div>
      </FieldSection>

      <FieldSection
        title="Identity"
        description={
          isClient
            ? "BVN is required. Numbers are stored securely and shown masked everywhere except this client's profile."
            : "A BVN or NIN identifies the person, so the same director is never filed twice."
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {text("bvn", "BVN", {
            required: isClient,
            inputMode: "numeric",
            placeholder: "11 digits",
            onBlur: onIdentityBlur,
          })}
          {text("nin", "NIN", {
            inputMode: "numeric",
            placeholder: "11 digits",
            onBlur: onIdentityBlur,
          })}
        </div>
        {identityNote}
        {isClient && (
          <div className="grid gap-4 sm:grid-cols-3">
            {select("id_type", "ID document", ID_TYPES)}
            {text("id_number", "ID number")}
            {text("id_expiry", "ID expiry", { type: "date" })}
          </div>
        )}
      </FieldSection>

      <FieldSection title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          {text("phone", "Phone", {
            required: isClient,
            type: "tel",
            inputMode: "tel",
            placeholder: "+234 803 123 4567",
          })}
          {text("email", "Email", { type: "email", inputMode: "email" })}
        </div>
        <Field
          label="Residential address"
          htmlFor={`${idPrefix}-residential_address`}
          required={isClient}
          error={errors?.residential_address?.message}
        >
          <Textarea
            id={`${idPrefix}-residential_address`}
            rows={2}
            {...form.register(path("residential_address"))}
            aria-invalid={errors?.residential_address ? true : undefined}
            aria-describedby={`${idPrefix}-residential_address-error`}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {select("state", "State", NIGERIAN_STATES)}
          {text("lga", "LGA")}
        </div>
      </FieldSection>

      {isClient && (
        <>
          <FieldSection title="Work and income">
            <div className="grid gap-4 sm:grid-cols-2">
              {text("occupation", "Occupation")}
              {text("employer_or_business", "Employer or business")}
            </div>
            <div className="sm:w-1/2 sm:pr-2">
              {select("monthly_income_range", "Monthly income", INCOME_RANGES)}
            </div>
          </FieldSection>

          <FieldSection title="Next of kin">
            <div className="grid gap-4 sm:grid-cols-3">
              {text("next_of_kin_name", "Name")}
              {text("next_of_kin_phone", "Phone", {
                type: "tel",
                inputMode: "tel",
                placeholder: "+234…",
              })}
              {text("next_of_kin_relationship", "Relationship", { placeholder: "e.g. Spouse" })}
            </div>
          </FieldSection>
        </>
      )}

      <Controller
        control={form.control}
        name={path("is_pep")}
        render={({ field }) => (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <label htmlFor={`${idPrefix}-is_pep`} className="text-small font-medium">
                Politically exposed person (PEP)
              </label>
              <p className="text-small text-muted-foreground">
                Holds or has held a prominent public office, or is a close relative or associate of
                someone who has. Calls for enhanced due diligence.
              </p>
            </div>
            <Switch
              id={`${idPrefix}-is_pep`}
              checked={field.value === true}
              onCheckedChange={field.onChange}
            />
          </div>
        )}
      />
    </>
  );
}
