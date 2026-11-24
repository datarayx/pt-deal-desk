"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LinkIcon } from "lucide-react";
import { useState, useTransition } from "react";
import type * as React from "react";
import { Controller, type Resolver, useForm, useWatch } from "react-hook-form";

import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { SelectInput } from "@/components/common/select-input";
import { Input } from "@/components/ui/input";
import { findPerson, type PersonMatch } from "@/features/clients/actions";
import { FieldSection } from "@/features/clients/components/field-section";
import { PersonFields } from "@/features/clients/components/person-fields";
import { DIRECTOR_ROLES, directorRoleLabel } from "@/features/clients/options";
import { type DirectorInput, directorSchema } from "@/features/clients/schemas";
import { emptyPerson, personName } from "@/features/clients/wizard-draft";

const digits = (v: string) => v.replace(/\s/g, "");

/** Add or edit one director/shareholder. Saves into the wizard draft (nothing is stored yet). */
export function DirectorSheet({
  director,
  trigger,
  onSave,
}: {
  director?: DirectorInput;
  trigger: React.ReactNode;
  onSave: (value: DirectorInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [match, setMatch] = useState<PersonMatch | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [looking, startLookup] = useTransition();
  const blank: DirectorInput = {
    profile: emptyPerson(),
    role: "director_shareholder",
    shareholding_pct: "",
  };

  const form = useForm<DirectorInput>({
    resolver: zodResolver(directorSchema as never) as unknown as Resolver<DirectorInput>,
    defaultValues: director ?? blank,
    mode: "onTouched",
  });
  const role = useWatch({ control: form.control, name: "role" });
  const linkedName = useWatch({ control: form.control, name: "linked_name" });
  const { errors } = form.formState;

  function openChange(next: boolean) {
    if (next) {
      form.reset(director ?? { ...blank, profile: emptyPerson() });
      setMatch(null);
      setLookupError(null);
    }
    setOpen(next);
  }

  function lookup() {
    const bvn = digits(form.getValues("profile.bvn"));
    const nin = digits(form.getValues("profile.nin"));
    const valid = (v: string) => /^[0-9]{11}$/.test(v);
    if (!valid(bvn) && !valid(nin)) return;
    startLookup(async () => {
      const result = await findPerson({
        bvn: valid(bvn) ? bvn : null,
        nin: valid(nin) ? nin : null,
      });
      if (!result.ok) {
        setLookupError(result.error);
        return;
      }
      setLookupError(null);
      const found = result.data?.match ?? null;
      setMatch(found);
      if (found) {
        // Link to the person on file: same id, their name; other blanks fill from this form.
        form.setValue("profile.id", found.id);
        form.setValue("profile.first_name", found.first_name, { shouldValidate: true });
        form.setValue("profile.middle_name", found.middle_name ?? "");
        form.setValue("profile.last_name", found.last_name, { shouldValidate: true });
        form.setValue(
          "linked_name",
          personName({ ...found, middle_name: found.middle_name ?? "" }),
        );
      } else if (form.getValues("linked_name")) {
        // The number changed away from a linked person: start a fresh record.
        form.setValue("profile.id", crypto.randomUUID());
        form.setValue("linked_name", undefined);
      }
    });
  }

  const identityNote = looking ? (
    <p className="text-small text-muted-foreground" role="status">
      Checking whether this person is already on file…
    </p>
  ) : lookupError ? (
    <p className="text-small text-danger" role="alert">
      {lookupError}
    </p>
  ) : match || linkedName ? (
    <div
      className="flex gap-3 rounded-lg border border-accent/50 bg-accent-soft/40 p-3 text-small"
      role="status"
    >
      <LinkIcon className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden />
      <div className="space-y-0.5">
        <p className="font-medium">
          Linked to{" "}
          {match ? personName({ ...match, middle_name: match.middle_name ?? "" }) : linkedName},
          already on file
        </p>
        {match && (
          <p className="text-muted-foreground">
            {[
              match.bvn_masked && `BVN ${match.bvn_masked}`,
              match.nin_masked && `NIN ${match.nin_masked}`,
            ]
              .filter(Boolean)
              .join(" · ")}
            {match.client_name && ` · Client: ${match.client_name}`}
            {match.companies.length > 0 && ` · Director of ${match.companies.join(", ")}`}
          </p>
        )}
        <p className="text-muted-foreground">
          Their saved details are kept; anything blank on file is filled from this form.
        </p>
      </div>
    </div>
  ) : null;

  return (
    <FormSheet
      open={open}
      onOpenChange={openChange}
      trigger={trigger}
      title={director ? "Edit director" : "Add a director or shareholder"}
      description="Each person is filed once and linked to every company they're involved in."
      submitLabel={director ? "Save" : "Add person"}
      pending={looking}
      formError={null}
      onSubmit={(event) => {
        void form.handleSubmit(() => {
          onSave(form.getValues());
          setOpen(false);
        })(event);
      }}
    >
      <FieldSection title="Role in the company">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role" htmlFor="dir-role" required>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <SelectInput
                  id="dir-role"
                  value={field.value}
                  onChange={field.onChange}
                  options={DIRECTOR_ROLES.map((r) => ({ value: r, label: directorRoleLabel[r] }))}
                />
              )}
            />
          </Field>
          <Field
            label="Shareholding"
            htmlFor="dir-pct"
            required={role !== "director"}
            hint={role === "director" ? "Leave blank if they hold no shares." : undefined}
            error={errors.shareholding_pct?.message}
          >
            <div className="relative">
              <Input
                id="dir-pct"
                inputMode="decimal"
                className="pr-8 text-right num"
                {...form.register("shareholding_pct")}
                aria-invalid={errors.shareholding_pct ? true : undefined}
                aria-describedby="dir-pct-hint dir-pct-error"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-small text-muted-foreground">
                %
              </span>
            </div>
          </Field>
        </div>
      </FieldSection>
      <PersonFields
        form={form}
        variant="director"
        idPrefix="dir"
        onIdentityBlur={lookup}
        identityNote={identityNote}
      />
    </FormSheet>
  );
}
