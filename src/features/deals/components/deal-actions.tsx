"use client";

import { useRouter } from "next/navigation";
import type * as React from "react";
import { Controller } from "react-hook-form";

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
import { disburseDeal, moveDealStage, updateDealOutcome } from "@/features/deals/actions";
import type { DealDetail, DealStage } from "@/features/deals/detail-queries";
import { dealOutcomeSchema, disburseDealSchema, moveStageSchema } from "@/features/deals/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";

export function DealActions({ data }: { data: DealDetail }) {
  const { deal, stage, stages } = data;
  const canAct = !deal.disbursement_date && ["open", "negotiating"].includes(deal.outcome);
  const canMove = canAct;
  const canDisburse = canAct;
  const moveStages = stages.filter(
    (item) => item.id !== stage.id && item.system_key !== "disbursed",
  );

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canMove && moveStages.length > 0 && (
        <MoveStageSheet
          dealId={deal.id}
          currentStage={stage}
          stages={moveStages}
          trigger={<Button variant="outline">Move stage</Button>}
        />
      )}
      {canAct && (
        <OutcomeSheet
          dealId={deal.id}
          outcome="negotiating"
          trigger={<Button variant="outline">Mark negotiating</Button>}
        />
      )}
      {canAct && (
        <div className="flex items-center gap-2">
          <OutcomeSheet
            dealId={deal.id}
            outcome="declined_by_lender"
            trigger={<Button variant="outline">Decline lender</Button>}
          />
          <OutcomeSheet
            dealId={deal.id}
            outcome="declined_by_client"
            trigger={<Button variant="outline">Decline client</Button>}
          />
        </div>
      )}
      {canDisburse && <DisburseSheet deal={deal} trigger={<Button>Disburse</Button>} />}
    </div>
  );
}

function MoveStageSheet({
  dealId,
  currentStage,
  stages,
  trigger,
}: {
  dealId: string;
  currentStage: DealStage;
  stages: DealStage[];
  trigger: React.ReactNode;
}) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: moveStageSchema,
    defaultValues: { stage_name: "", note: "" },
    action: (values) => moveDealStage(dealId, values.stage_name, values.note),
    successMessage: "Deal stage moved",
  });
  const { errors } = form.formState;
  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title="Move deal stage"
      description={`Current stage: ${currentStage.name}. Exit criteria are warnings, so you can add a note when overriding them.`}
      submitLabel="Move stage"
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field label="New stage" htmlFor="deal-new-stage" required error={errors.stage_name?.message}>
        <Controller
          control={form.control}
          name="stage_name"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="deal-new-stage" className="w-full">
                <SelectValue placeholder="Choose a stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((item) => (
                  <SelectItem key={item.id} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field
        label="Note"
        htmlFor="deal-stage-note"
        hint="Optional context is saved with the stage history."
        error={errors.note?.message}
      >
        <Textarea
          id="deal-stage-note"
          rows={4}
          placeholder="e.g. All required documents received"
          {...form.register("note")}
        />
      </Field>
    </FormSheet>
  );
}

function OutcomeSheet({
  dealId,
  outcome,
  trigger,
}: {
  dealId: string;
  outcome: "declined_by_lender" | "declined_by_client" | "negotiating";
  trigger: React.ReactNode;
}) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: dealOutcomeSchema,
    defaultValues: { reason: "" },
    action: (values) => updateDealOutcome(dealId, outcome, values),
    successMessage: outcome === "negotiating" ? "Deal marked negotiating" : "Deal declined",
  });
  const { errors } = form.formState;
  const title = outcome === "negotiating" ? "Mark as negotiating" : "Decline deal";
  const description =
    outcome === "negotiating"
      ? "Record why the deal is still being negotiated."
      : "A decline reason is required and stays on the deal history.";
  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={title}
      description={description}
      submitLabel={outcome === "negotiating" ? "Mark negotiating" : "Decline deal"}
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      {outcome !== "negotiating" && (
        <Field label="Decline type" htmlFor="deal-decline-type">
          <Select value={outcome} disabled>
            <SelectTrigger id="deal-decline-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="declined_by_lender">Declined by lender</SelectItem>
              <SelectItem value="declined_by_client">Declined by client</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}
      <Field label="Reason" htmlFor="deal-outcome-reason" required error={errors.reason?.message}>
        <Textarea
          id="deal-outcome-reason"
          rows={5}
          autoFocus
          placeholder={
            outcome === "negotiating"
              ? "What is still being negotiated?"
              : "Why was this deal declined?"
          }
          {...form.register("reason")}
        />
      </Field>
    </FormSheet>
  );
}

function DisburseSheet({ deal, trigger }: { deal: DealDetail["deal"]; trigger: React.ReactNode }) {
  const router = useRouter();
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: disburseDealSchema,
    defaultValues: {
      amount: deal.amount_approved ?? deal.amount_requested ?? "",
      disbursed_on: "",
      first_repayment_date: "",
      frequency: "monthly",
    },
    action: (values) => disburseDeal(deal.id, values),
    successMessage: "Deal disbursed and repayment schedule generated",
    onSuccess: () => router.refresh(),
  });
  const { errors } = form.formState;
  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title="Disburse deal"
      description="This records the amount and dates, generates the repayment schedule, moves the deal to Disbursed and recognises any due fees."
      submitLabel="Disburse & generate schedule"
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field
        label="Disbursed amount"
        htmlFor="deal-disbursed-amount"
        required
        error={errors.amount?.message}
      >
        <Input
          id="deal-disbursed-amount"
          inputMode="decimal"
          className="num"
          {...form.register("amount")}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Disbursement date"
          htmlFor="deal-disbursed-on"
          required
          error={errors.disbursed_on?.message}
        >
          <Input id="deal-disbursed-on" type="date" {...form.register("disbursed_on")} />
        </Field>
        <Field
          label="First repayment date"
          htmlFor="deal-first-repayment"
          required
          error={errors.first_repayment_date?.message}
        >
          <Input id="deal-first-repayment" type="date" {...form.register("first_repayment_date")} />
        </Field>
      </div>
      <Field
        label="Repayment frequency"
        htmlFor="deal-frequency"
        required
        error={errors.frequency?.message}
      >
        <Controller
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="deal-frequency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="bullet">Bullet</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <p className="text-small text-muted-foreground">
        The schedule uses the deal&apos;s saved tenor and monthly interest rate.
      </p>
    </FormSheet>
  );
}
