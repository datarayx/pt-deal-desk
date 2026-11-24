"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type Resolver, useForm } from "react-hook-form";
import { z } from "zod";

import { PersonFields } from "@/features/clients/components/person-fields";
import { SectorNotesFields } from "@/features/clients/components/sector-notes-fields";
import { StepFrame } from "@/features/clients/components/step-frame";
import { individualSchema } from "@/features/clients/schemas";
import type { PersonInput } from "@/features/clients/wizard-draft";
import { optionalText } from "@/lib/validation";

const schema = z.object({
  profile: individualSchema,
  sector: optionalText(120),
  notes: optionalText(2000),
});
type Values = { profile: PersonInput; sector: string; notes: string };

export function StepIndividualDetails({
  defaultValues,
  onNext,
  onBack,
}: {
  defaultValues: Values;
  onNext: (values: Values) => void;
  /** Going back keeps what was typed, without validating it. */
  onBack: (values: Values) => void;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(schema as never) as unknown as Resolver<Values>,
    defaultValues,
    mode: "onTouched",
  });

  return (
    <StepFrame
      title="Client details"
      description="Know-your-customer information for the person borrowing. Fields marked * are required."
      onSubmit={form.handleSubmit(() => onNext(form.getValues()))}
      onBack={() => onBack(form.getValues())}
    >
      <PersonFields form={form} variant="client" idPrefix="client" />
      <SectorNotesFields form={form} />
    </StepFrame>
  );
}
