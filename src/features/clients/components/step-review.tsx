"use client";

import { DetailList } from "@/components/common/detail-list";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ReviewSection } from "@/features/clients/components/review-section";
import { StepFrame } from "@/features/clients/components/step-frame";
import {
  clientTypeLabel,
  companyTypeLabel,
  directorRoleLabel,
  enquirySourceLabel,
  genderLabel,
  maskId,
} from "@/features/clients/options";
import { newClientSchema } from "@/features/clients/schemas";
import { type Draft, personName, type StepKey } from "@/features/clients/wizard-draft";
import { formatDate } from "@/lib/format/date";
import { formatRate } from "@/lib/format/rate";
import { kycStatus } from "@/lib/status";

const none = <span className="text-muted-foreground">Not given</span>;
const show = (v: string | null | undefined) => (v ? v : none);
const date = (v: string | null | undefined) => (v ? formatDate(v) : none);

export function StepReview({
  draft,
  referrerName,
  requiredDocs,
  attachedRequiredDocs,
  pending,
  error,
  onConsent,
  onEdit,
  onBack,
  onSubmit,
}: {
  draft: Draft;
  referrerName: string | null;
  requiredDocs: number;
  attachedRequiredDocs: number;
  pending: boolean;
  error: string | null;
  onConsent: (value: boolean) => void;
  onEdit: (step: StepKey) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  // Show values the way they'll be saved (normalised phone, CAC number…).
  const parsed = newClientSchema.safeParse({ ...draft, consent: true });
  const v = parsed.success ? parsed.data : null;
  const status = attachedRequiredDocs === requiredDocs ? kycStatus.submitted : kycStatus.incomplete;

  return (
    <StepFrame
      title="Review and create"
      description="Check the details, confirm consent, then create the client."
      onBack={onBack}
      submitLabel="Create client"
      pending={pending}
      error={
        error ??
        (parsed.success
          ? null
          : (parsed.error.issues[0]?.message ?? "Some details need attention."))
      }
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <ReviewSection title="Client" onEdit={() => onEdit("type")}>
        <DetailList
          rows={[
            { label: "Type", value: clientTypeLabel[draft.client_type] },
            {
              label: "Found P&T through",
              value: draft.enquiry_source ? enquirySourceLabel[draft.enquiry_source] : none,
            },
            { label: "Referred by", value: show(referrerName) },
          ]}
        />
      </ReviewSection>

      {v?.client_type === "individual" && (
        <ReviewSection title="Details" onEdit={() => onEdit("details")}>
          <DetailList
            rows={[
              {
                label: "Name",
                value: [v.individual.title, personName(draft.individual)].filter(Boolean).join(" "),
              },
              {
                label: "Gender · date of birth",
                value: (
                  <>
                    {v.individual.gender ? genderLabel[v.individual.gender] : "—"} ·{" "}
                    {date(v.individual.date_of_birth)}
                  </>
                ),
              },
              {
                label: "BVN",
                value: <span className="num tracking-wider">{maskId(v.individual.bvn)}</span>,
              },
              {
                label: "NIN",
                value: v.individual.nin ? (
                  <span className="num tracking-wider">{maskId(v.individual.nin)}</span>
                ) : (
                  none
                ),
              },
              { label: "Phone", value: <span className="num">{v.individual.phone}</span> },
              { label: "Email", value: show(v.individual.email) },
              {
                label: "Address",
                value: [v.individual.residential_address, v.individual.lga, v.individual.state]
                  .filter(Boolean)
                  .join(", "),
              },
              {
                label: "Occupation",
                value: show(
                  [v.individual.occupation, v.individual.employer_or_business]
                    .filter(Boolean)
                    .join(" at "),
                ),
              },
              {
                label: "Next of kin",
                value: show(
                  [
                    v.individual.next_of_kin_name,
                    v.individual.next_of_kin_relationship,
                    v.individual.next_of_kin_phone,
                  ]
                    .filter(Boolean)
                    .join(" · "),
                ),
              },
              { label: "Sector", value: show(v.sector) },
              {
                label: "PEP",
                value: v.individual.is_pep ? (
                  <Badge variant="warning">Politically exposed</Badge>
                ) : (
                  "No"
                ),
              },
            ]}
          />
        </ReviewSection>
      )}

      {v?.client_type === "company" && (
        <>
          <ReviewSection title="Company" onEdit={() => onEdit("details")}>
            <DetailList
              rows={[
                { label: "Registered name", value: v.company.registered_name },
                { label: "Type", value: companyTypeLabel[v.company.company_type] },
                { label: "CAC number", value: <span className="num">{v.company.rc_number}</span> },
                { label: "Incorporated", value: date(v.company.incorporation_date) },
                { label: "TIN", value: show(v.company.tin) },
                { label: "Registered address", value: v.company.registered_address },
                {
                  label: "Contact",
                  value: [
                    v.company.contact_person,
                    v.company.contact_phone,
                    v.company.contact_email,
                  ]
                    .filter(Boolean)
                    .join(" · "),
                },
                {
                  label: "Sector · turnover",
                  value: show(
                    [v.sector, v.company.annual_turnover_range].filter(Boolean).join(" · "),
                  ),
                },
              ]}
            />
          </ReviewSection>
          <ReviewSection
            title={`Directors and shareholders (${v.directors.length})`}
            onEdit={() => onEdit("directors")}
          >
            <ul className="divide-y divide-border">
              {draft.directors.map((d) => (
                <li
                  key={d.profile.id}
                  className="flex flex-wrap items-center gap-x-4 px-4 py-2.5 text-small"
                >
                  <span className="flex-1 font-medium">
                    {personName(d.profile)}
                    {d.linked_name && (
                      <span className="font-normal text-muted-foreground"> · already on file</span>
                    )}
                  </span>
                  <span className="num text-muted-foreground">
                    {[
                      d.profile.bvn && `BVN ${maskId(d.profile.bvn)}`,
                      d.profile.nin && `NIN ${maskId(d.profile.nin)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <span className="w-40 text-muted-foreground">{directorRoleLabel[d.role]}</span>
                  <span className="w-14 text-right num">
                    {d.shareholding_pct ? formatRate(d.shareholding_pct) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </ReviewSection>
        </>
      )}

      <ReviewSection title="KYC documents" onEdit={() => onEdit("documents")}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-small">
          <span>
            <span className="num">{attachedRequiredDocs}</span> of{" "}
            <span className="num">{requiredDocs}</span> required documents attached
            {draft.documents.length > attachedRequiredDocs && (
              <span className="text-muted-foreground">
                {" "}
                · {draft.documents.length - attachedRequiredDocs} optional
              </span>
            )}
          </span>
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            KYC status will be <StatusBadge status={status} />
          </span>
        </div>
      </ReviewSection>

      <label
        htmlFor="consent"
        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 has-[:checked]:border-accent/60 has-[:checked]:bg-accent-soft/40"
      >
        <Checkbox
          id="consent"
          className="mt-0.5"
          checked={draft.consent}
          onCheckedChange={(value) => onConsent(value === true)}
        />
        <span className="space-y-1">
          <span className="block text-body font-medium">
            The client{draft.client_type === "company" ? " and each director" : ""} agreed to P&T
            processing this data
          </span>
          <span className="block text-small text-muted-foreground">
            Required under the Nigeria Data Protection Act. P&T uses it only to assess and arrange
            finance; the date of consent is recorded.
          </span>
        </span>
      </label>
    </StepFrame>
  );
}
