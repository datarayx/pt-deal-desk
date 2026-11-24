"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2Icon, UserIcon } from "lucide-react";
import { Controller, type Resolver, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Field } from "@/components/common/field";
import { SelectInput } from "@/components/common/select-input";
import { StepFrame } from "@/features/clients/components/step-frame";
import {
  CLIENT_TYPES,
  type ClientType,
  ENQUIRY_SOURCES,
  type EnquirySource,
  enquirySourceLabel,
} from "@/features/clients/options";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    client_type: z.enum(CLIENT_TYPES),
    enquiry_source: z.enum(ENQUIRY_SOURCES, "Choose how they found P&T."),
    referrer_id: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.enquiry_source === "referral" && !v.referrer_id) {
      ctx.addIssue({ code: "custom", path: ["referrer_id"], message: "Choose who referred them." });
    }
  });

type Values = { client_type: ClientType; enquiry_source: EnquirySource | ""; referrer_id: string };

const typeCards = [
  {
    value: "company",
    icon: Building2Icon,
    title: "Company",
    text: "Ltd, Plc, business name or NGO. You'll add directors and shareholders next.",
  },
  {
    value: "individual",
    icon: UserIcon,
    title: "Individual",
    text: "A person borrowing in their own name, e.g. a sole trader or professional.",
  },
] as const;

export function StepType({
  defaultValues,
  referrers,
  onNext,
}: {
  defaultValues: Values;
  referrers: { id: string; name: string }[];
  onNext: (values: Values) => void;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(schema as never) as unknown as Resolver<Values>,
    defaultValues,
  });
  const { errors } = form.formState;
  const source = useWatch({ control: form.control, name: "enquiry_source" });

  return (
    <StepFrame
      title="What kind of client is this?"
      description="This decides which details and KYC documents P&T collects."
      onSubmit={form.handleSubmit((values) => onNext(values))}
    >
      <Controller
        control={form.control}
        name="client_type"
        render={({ field }) => (
          <fieldset>
            <legend className="sr-only">Client type</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {typeCards.map((card) => {
                const checked = field.value === card.value;
                return (
                  <label
                    key={card.value}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors",
                      "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                      checked
                        ? "border-accent bg-accent-soft/50"
                        : "border-border hover:bg-surface-subtle",
                    )}
                  >
                    <input
                      type="radio"
                      name="client_type"
                      value={card.value}
                      checked={checked}
                      onChange={() => field.onChange(card.value)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg border",
                        checked
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border text-muted-foreground",
                      )}
                      aria-hidden
                    >
                      <card.icon className="size-5" />
                    </span>
                    <span className="space-y-1">
                      <span className="block text-body font-semibold">{card.title}</span>
                      <span className="block text-small text-muted-foreground">{card.text}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="How did they find P&T?"
          htmlFor="enquiry-source"
          required
          error={errors.enquiry_source?.message}
        >
          <Controller
            control={form.control}
            name="enquiry_source"
            render={({ field }) => (
              <SelectInput
                id="enquiry-source"
                value={field.value}
                onChange={field.onChange}
                options={ENQUIRY_SOURCES.map((s) => ({ value: s, label: enquirySourceLabel[s] }))}
                invalid={!!errors.enquiry_source}
                describedBy="enquiry-source-error"
              />
            )}
          />
        </Field>
        <Field
          label="Referred by"
          htmlFor="referrer"
          required={source === "referral"}
          hint={referrers.length === 0 ? "Add referrers on the Referrers page first." : undefined}
          error={errors.referrer_id?.message}
        >
          <Controller
            control={form.control}
            name="referrer_id"
            render={({ field }) => (
              <SelectInput
                id="referrer"
                value={field.value}
                onChange={field.onChange}
                options={referrers.map((r) => ({ value: r.id, label: r.name }))}
                placeholder={source === "referral" ? "Choose referrer…" : "Nobody (optional)"}
                invalid={!!errors.referrer_id}
                describedBy="referrer-hint referrer-error"
              />
            )}
          />
        </Field>
      </div>
    </StepFrame>
  );
}
