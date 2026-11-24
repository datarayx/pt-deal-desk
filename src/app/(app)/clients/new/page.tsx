import { ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { NewClientWizard } from "@/features/clients/components/new-client-wizard";
import { getNewClientOptions } from "@/features/clients/queries";

export const metadata: Metadata = { title: "New client" };

async function Wizard() {
  const { referrers, checklist } = await getNewClientOptions();
  return <NewClientWizard referrers={referrers} checklist={checklist} />;
}

function WizardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading form">
      <Skeleton className="h-8 w-96 max-w-full rounded-full" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow={
          <Link href="/clients" className="inline-flex items-center gap-1 hover:text-foreground">
            <ChevronLeftIcon className="size-3.5" aria-hidden /> Clients
          </Link>
        }
        title="New client"
        description="Capture the client's details and KYC. Nothing is saved until the last step."
      />
      <Suspense fallback={<WizardSkeleton />}>
        <Wizard />
      </Suspense>
    </div>
  );
}
