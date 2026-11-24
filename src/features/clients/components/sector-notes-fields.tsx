"use client";

import type { FieldErrors, FieldValues, Path, UseFormReturn } from "react-hook-form";

import { Field } from "@/components/common/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldSection } from "@/features/clients/components/field-section";
import { SECTORS } from "@/features/clients/options";

type Form = { sector: string; notes: string } & FieldValues;

/** Sector (free text with suggestions) and internal notes, shared by both detail steps. */
export function SectorNotesFields<T extends Form>({ form }: { form: UseFormReturn<T> }) {
  const errors = form.formState.errors as FieldErrors<{ sector: string; notes: string }>;
  return (
    <FieldSection title="About the business">
      <Field
        label="Sector"
        htmlFor="client-sector"
        hint="Pick a suggestion or type your own."
        error={errors.sector?.message}
        className="sm:w-1/2 sm:pr-2"
      >
        <Input
          id="client-sector"
          list="sector-options"
          autoComplete="off"
          {...form.register("sector" as Path<T>)}
          aria-invalid={errors.sector ? true : undefined}
          aria-describedby="client-sector-hint client-sector-error"
        />
        <datalist id="sector-options">
          {SECTORS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </Field>
      <Field
        label="Notes"
        htmlFor="client-notes"
        hint="Internal only."
        error={errors.notes?.message}
      >
        <Textarea
          id="client-notes"
          rows={3}
          {...form.register("notes" as Path<T>)}
          aria-invalid={errors.notes ? true : undefined}
          aria-describedby="client-notes-hint client-notes-error"
        />
      </Field>
    </FieldSection>
  );
}
