"use client";

import { ListChecksIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { SortableList } from "@/components/common/sortable-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteKycDocType, reorderKycDocTypes } from "@/features/settings/actions/kyc-actions";
import { KycDocSheet } from "@/features/settings/components/kyc-doc-sheet";
import type { KycDocTypeRow } from "@/features/settings/queries";

const groups = [
  { value: "company", label: "Companies" },
  { value: "individual", label: "Individuals & directors" },
] as const;

export function KycChecklists({ docTypes }: { docTypes: KycDocTypeRow[] }) {
  async function onReorder(ids: string[]) {
    const result = await reorderKycDocTypes(ids);
    if (!result.ok) toast.error(result.error);
    return result.ok;
  }

  return (
    <Tabs defaultValue="company" className="gap-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <TabsList variant="segmented">
          {groups.map((g) => (
            <TabsTrigger key={g.value} value={g.value}>
              {g.label}
              <span className="num text-muted-foreground">
                {docTypes.filter((d) => d.client_type === g.value).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {groups.map((g) => {
        const items = docTypes.filter((d) => d.client_type === g.value);
        return (
          <TabsContent key={g.value} value={g.value}>
            <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-1">
              <p className="text-small text-muted-foreground">
                Drag to set the order clients see. Documents already filed can&apos;t be deleted.
              </p>
              <KycDocSheet
                clientType={g.value}
                trigger={
                  <Button variant="outline" size="sm">
                    <PlusIcon /> Add document
                  </Button>
                }
              />
            </div>
            {items.length === 0 ? (
              <EmptyState
                variant="plain"
                icon={<ListChecksIcon />}
                title="No documents on this checklist"
                description="Add the documents you ask every client of this type for."
              />
            ) : (
              <SortableList
                items={items}
                label={`${g.label} KYC documents`}
                onReorder={onReorder}
                renderItem={(doc) => (
                  <div className="flex min-h-12 items-center gap-3 py-2">
                    <span className="min-w-0 flex-1 text-body">{doc.name}</span>
                    <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
                      {doc.is_required ? (
                        <Badge variant="accent">Required</Badge>
                      ) : (
                        <Badge variant="outline">Optional</Badge>
                      )}
                      {doc.has_expiry && <Badge variant="warning">Expires</Badge>}
                    </span>
                    <span className="flex shrink-0 items-center gap-0.5">
                      <KycDocSheet
                        clientType={g.value}
                        docType={doc}
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${doc.name}`}>
                            <PencilIcon />
                          </Button>
                        }
                      />
                      {doc.document_count > 0 ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0} className="inline-flex rounded-md">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled
                                aria-label={`${doc.name} is in use`}
                              >
                                <Trash2Icon />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {doc.document_count} client file{doc.document_count === 1 ? "" : "s"}{" "}
                            use it — make it optional instead
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Delete ${doc.name}`}
                            >
                              <Trash2Icon />
                            </Button>
                          }
                          title="Remove this document from the checklist?"
                          description={`“${doc.name}” will no longer be requested from new clients.`}
                          confirmLabel="Remove document"
                          onConfirm={async () => {
                            const result = await deleteKycDocType(doc.id);
                            if (result.ok) toast.success("Document removed");
                            else toast.error(result.error);
                            return result.ok;
                          }}
                        />
                      )}
                    </span>
                  </div>
                )}
              />
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
