import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Button } from "@/components/ui/button";
import { ClientsTable } from "@/features/clients/components/clients-table";
import { getClients } from "@/features/clients/queries";
import { getSavedViews } from "@/features/saved-views/queries";

export const metadata: Metadata = { title: "Clients" };

async function ClientsSection() {
  const [clients, savedViews] = await Promise.all([getClients(), getSavedViews("clients")]);
  return <ClientsTable clients={clients} savedViews={savedViews} />;
}

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Companies and individuals P&T raises finance for: their KYC, credit history and what they owe."
        actions={
          <Button asChild>
            <Link href="/clients/new">
              <PlusIcon /> New client
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<DataTableSkeleton columns={8} rows={10} />}>
        <ClientsSection />
      </Suspense>
    </div>
  );
}
