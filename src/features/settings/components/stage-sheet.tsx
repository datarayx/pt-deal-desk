"use client";

import type * as React from "react";
import { Controller } from "react-hook-form";

import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createStage, updateStage } from "@/features/settings/actions/stage-actions";
import type { StageRow } from "@/features/settings/queries";
import { STAGE_COLORS, stageSchema } from "@/features/settings/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";
import { cn } from "@/lib/utils";

const colorNames: Record<(typeof STAGE_COLORS)[number], string> = {
  "#7C93AB": "Slate",
  "#00B29E": "Teal",
  "#00796F": "Deep teal",
  "#011A32": "Navy",
  "#1D4ED8": "Blue",
  "#B45309": "Amber",
  "#047857": "Green",
  "#B91C1C": "Red",
};

export function StageSheet({ stage, trigger }: { stage?: StageRow; trigger: React.ReactNode }) {
  const isWorkflow = Boolean(stage?.system_key);
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: stageSchema,
    defaultValues: {
      name: stage?.name ?? "",
      color: (STAGE_COLORS as readonly string[]).includes(stage?.color ?? "")
        ? (stage?.color as (typeof STAGE_COLORS)[number])
        : "#7C93AB",
      is_terminal: stage?.is_terminal ?? false,
    },
    action: (values) => (stage ? updateStage(stage.id, values) : createStage(values)),
    successMessage: stage ? "Stage updated" : "Stage added",
  });
  const { errors } = form.formState;

  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={stage ? `Edit “${stage.name}”` : "Add a deal stage"}
      description={
        isWorkflow
          ? "This stage is part of the deal workflow. You can rename it and change its colour."
          : "New stages are added at the end of the pipeline. Drag to reorder them."
      }
      submitLabel={stage ? "Save stage" : "Add stage"}
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field label="Stage name" htmlFor="stage-name" required error={errors.name?.message}>
        <Input
          id="stage-name"
          autoFocus
          {...form.register("name")}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby="stage-name-error"
        />
      </Field>

      <Controller
        control={form.control}
        name="color"
        render={({ field }) => (
          <fieldset className="space-y-2">
            <legend className="text-small font-medium">Colour on the pipeline board</legend>
            <div role="radiogroup" aria-label="Stage colour" className="flex flex-wrap gap-2">
              {STAGE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={field.value === color}
                  aria-label={colorNames[color]}
                  onClick={() => field.onChange(color)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg border border-border transition-shadow",
                    field.value === color && "ring-2 ring-ring ring-offset-2 ring-offset-popover",
                  )}
                >
                  <span className="size-5 rounded-md" style={{ backgroundColor: color }} />
                </button>
              ))}
            </div>
          </fieldset>
        )}
      />

      <Controller
        control={form.control}
        name="is_terminal"
        render={({ field }) => (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <label htmlFor="stage-terminal" className="text-small font-medium">
                Final stage
              </label>
              <p className="text-small text-muted-foreground">
                {isWorkflow
                  ? "Fixed for workflow stages."
                  : "Deals here are finished: no stale reminders."}
              </p>
            </div>
            <Switch
              id="stage-terminal"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isWorkflow}
            />
          </div>
        )}
      />
    </FormSheet>
  );
}
