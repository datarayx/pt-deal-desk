"use client";

import { DocumentUploadRow } from "@/features/clients/components/document-upload-row";
import { StepFrame } from "@/features/clients/components/step-frame";
import type { KycChecklistItem } from "@/features/clients/queries";
import type { DocumentInput } from "@/features/clients/schemas";

export type DocumentGroup = {
  personId: string | null;
  title: string;
  subtitle?: string;
  items: KycChecklistItem[];
};

const keyOf = (personId: string | null, typeId: string) => `${personId ?? "client"}:${typeId}`;

export function StepDocuments({
  clientId,
  groups,
  documents,
  onChange,
  onNext,
  onBack,
}: {
  clientId: string;
  groups: DocumentGroup[];
  documents: DocumentInput[];
  onChange: (documents: DocumentInput[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const byKey = new Map(documents.map((d) => [keyOf(d.person_id, d.document_type_id), d]));
  const required = groups.flatMap((g) =>
    g.items.filter((i) => i.is_required).map((i) => keyOf(g.personId, i.id)),
  );
  const attached = required.filter((k) => byKey.has(k)).length;

  function setDoc(personId: string | null, typeId: string, doc: DocumentInput | null) {
    const key = keyOf(personId, typeId);
    const rest = documents.filter((d) => keyOf(d.person_id, d.document_type_id) !== key);
    onChange(doc ? [...rest, doc] : rest);
  }

  return (
    <StepFrame
      title="KYC documents"
      description={
        <>
          Upload what you have now: PDF or photos, up to 10 MB each. Anything missing can be added
          later from the client&apos;s profile; the client stays <em>Incomplete</em> until every
          required document is in.
        </>
      }
      onBack={onBack}
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
    >
      <p className="num text-small text-muted-foreground" aria-live="polite">
        {attached} of {required.length} required documents attached
      </p>
      {groups.map((group) => (
        <section key={group.personId ?? "client"} className="space-y-2">
          <div>
            <h3 className="text-body font-semibold">{group.title}</h3>
            {group.subtitle && <p className="text-small text-muted-foreground">{group.subtitle}</p>}
          </div>
          {group.items.length === 0 ? (
            <p className="text-small text-muted-foreground">
              No documents on this checklist. Set them up in Settings → KYC checklists.
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {group.items.map((item) => (
                <DocumentUploadRow
                  key={item.id}
                  clientId={clientId}
                  personId={group.personId}
                  item={item}
                  document={byKey.get(keyOf(group.personId, item.id))}
                  onChange={(doc) => setDoc(group.personId, item.id, doc)}
                />
              ))}
            </ul>
          )}
        </section>
      ))}
    </StepFrame>
  );
}
