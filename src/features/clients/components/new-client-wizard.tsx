"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/features/clients/actions";
import { StepCompanyDetails } from "@/features/clients/components/step-company-details";
import { StepDirectors } from "@/features/clients/components/step-directors";
import { type DocumentGroup, StepDocuments } from "@/features/clients/components/step-documents";
import { StepIndividualDetails } from "@/features/clients/components/step-individual-details";
import { StepReview } from "@/features/clients/components/step-review";
import { StepType } from "@/features/clients/components/step-type";
import { WizardStepper } from "@/features/clients/components/wizard-stepper";
import { removeKycFiles } from "@/features/clients/kyc-upload";
import type { KycChecklistItem } from "@/features/clients/queries";
import type { DirectorInput } from "@/features/clients/schemas";
import {
  type Draft,
  emptyDraft,
  personName,
  type StepKey,
  stepsFor,
} from "@/features/clients/wizard-draft";

/** New Client: type → details → directors (companies) → documents → review (SCREENS.md). */
export function NewClientWizard({
  referrers,
  checklist,
}: {
  referrers: { id: string; name: string }[];
  checklist: KycChecklistItem[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [index, setIndex] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const steps = stepsFor(draft.client_type);
  const step = steps[index]?.key ?? "type";

  // Warn before leaving with unsaved work (browser navigation / reload).
  useEffect(() => {
    if (!touched) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [touched]);

  const update = (patch: Partial<Draft>) => {
    setTouched(true);
    setDraft((d) => ({ ...d, ...patch }));
  };

  const goTo = (key: StepKey, list = steps) => {
    const i = Math.max(
      0,
      list.findIndex((s) => s.key === key),
    );
    setIndex(i);
    setFurthest((f) => Math.max(f, i));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = (list = steps) => {
    const key = list[index + 1]?.key;
    if (key) goTo(key, list);
  };
  const back = () => setIndex((i) => Math.max(0, i - 1));

  // Checklist groups: the client itself, plus each director for companies.
  const clientItems = checklist.filter((c) => c.client_type === draft.client_type);
  const personItems = checklist.filter((c) => c.client_type === "individual");
  const groups: DocumentGroup[] =
    draft.client_type === "individual"
      ? [{ personId: null, title: "Client documents", items: clientItems }]
      : [
          { personId: null, title: "Company documents", items: clientItems },
          ...draft.directors.map((d) => ({
            personId: d.profile.id,
            title: personName(d.profile),
            subtitle: "Director / shareholder documents",
            items: personItems,
          })),
        ];
  const requiredKeys = groups.flatMap((g) =>
    g.items.filter((i) => i.is_required).map((i) => `${g.personId ?? "client"}:${i.id}`),
  );
  const attachedKeys = new Set(
    draft.documents.map((d) => `${d.person_id ?? "client"}:${d.document_type_id}`),
  );
  const attachedRequired = requiredKeys.filter((k) => attachedKeys.has(k)).length;

  function setDirectors(directors: DirectorInput[]) {
    // Drop documents (and files) of anyone removed from the list.
    const ids = new Set(directors.map((d) => d.profile.id));
    const orphaned = draft.documents.filter((d) => d.person_id && !ids.has(d.person_id));
    void removeKycFiles(orphaned.map((d) => d.file_path));
    update({
      directors,
      documents: draft.documents.filter((d) => !d.person_id || ids.has(d.person_id)),
    });
  }

  async function discard() {
    await removeKycFiles(draft.documents.map((d) => d.file_path));
    setTouched(false);
    router.push("/clients");
    return true;
  }

  function submit() {
    setSubmitError(null);
    if (!draft.consent) {
      setSubmitError("Confirm the client agreed to P&T processing their data.");
      return;
    }
    startTransition(async () => {
      const result = await createClient(draft);
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      setTouched(false);
      toast.success(
        `${draft.client_type === "company" ? draft.company.registered_name : personName(draft.individual)} added`,
      );
      router.push(`/clients/${result.data?.id ?? ""}`);
    });
  }

  const referrerName = referrers.find((r) => r.id === draft.referrer_id)?.name ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WizardStepper steps={steps} current={index} furthest={furthest} onGo={setIndex} />
        {touched ? (
          <ConfirmDialog
            trigger={
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            }
            title="Discard this client?"
            description="Nothing has been saved yet. Any documents you uploaded will be deleted."
            confirmLabel="Discard"
            onConfirm={discard}
          />
        ) : (
          <Button type="button" variant="ghost" onClick={() => router.push("/clients")}>
            Cancel
          </Button>
        )}
      </div>

      {step === "type" && (
        <StepType
          defaultValues={{
            client_type: draft.client_type,
            enquiry_source: draft.enquiry_source,
            referrer_id: draft.referrer_id,
          }}
          referrers={referrers}
          onNext={(values) => {
            if (values.client_type !== draft.client_type) {
              // Different checklists and no directors for individuals: start those parts afresh.
              void removeKycFiles(draft.documents.map((d) => d.file_path));
              update({
                ...values,
                documents: [],
                directors: values.client_type === "company" ? draft.directors : [],
              });
              setFurthest(0);
              setIndex(1);
              return;
            }
            update(values);
            next();
          }}
        />
      )}

      {step === "details" && draft.client_type === "individual" && (
        <StepIndividualDetails
          defaultValues={{ profile: draft.individual, sector: draft.sector, notes: draft.notes }}
          onBack={(v) => {
            update({ individual: v.profile, sector: v.sector, notes: v.notes });
            back();
          }}
          onNext={(v) => {
            update({ individual: v.profile, sector: v.sector, notes: v.notes });
            next();
          }}
        />
      )}

      {step === "details" && draft.client_type === "company" && (
        <StepCompanyDetails
          defaultValues={{ company: draft.company, sector: draft.sector, notes: draft.notes }}
          onBack={(v) => {
            update({ company: v.company, sector: v.sector, notes: v.notes });
            back();
          }}
          onNext={(v) => {
            update({ company: v.company, sector: v.sector, notes: v.notes });
            next();
          }}
        />
      )}

      {step === "directors" && (
        <StepDirectors
          directors={draft.directors}
          onChange={setDirectors}
          onBack={back}
          onNext={() => next()}
        />
      )}

      {step === "documents" && (
        <StepDocuments
          clientId={draft.id}
          groups={groups}
          documents={draft.documents}
          onChange={(documents) => update({ documents })}
          onBack={back}
          onNext={() => next()}
        />
      )}

      {step === "review" && (
        <StepReview
          draft={draft}
          referrerName={referrerName}
          requiredDocs={requiredKeys.length}
          attachedRequiredDocs={attachedRequired}
          pending={pending}
          error={submitError}
          onConsent={(consent) => update({ consent })}
          onEdit={(key) => goTo(key)}
          onBack={back}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
