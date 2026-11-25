import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { ImportsWorkspace } from "@/features/imports/components/imports-workspace";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Data import" };

export default async function ImportsPage() {
  const user = await requireRole("ceo", "accountant");
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Migration"
        title="Data import"
        description="Bring historical workbooks into a staged, reviewable import batch before production records are changed."
      />
      <ImportsWorkspace role={user.role} />
    </div>
  );
}

