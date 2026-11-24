import type { Metadata } from "next";
import { Suspense } from "react";

import { CompanySheet } from "@/features/settings/components/company-sheet";
import { LogoUploader } from "@/features/settings/components/logo-uploader";
import { SettingsPanel } from "@/features/settings/components/settings-panel";
import { SettingsPanelSkeleton } from "@/features/settings/components/settings-panel-skeleton";
import { DetailList } from "@/components/common/detail-list";
import { getCompanyProfile } from "@/features/settings/queries";

export const metadata: Metadata = { title: "Company profile · Settings" };

const orDash = (v: string | null | undefined) =>
  v ? v : <span className="text-muted-foreground">Not set</span>;

async function CompanySection() {
  const company = await getCompanyProfile();
  return (
    <div className="space-y-8">
      <SettingsPanel
        title="Company profile"
        description="P&T's details as they appear on invoices, client statements and exported reports."
        action={<CompanySheet values={company} />}
        flush
      >
        <DetailList
          rows={[
            { label: "Company name", value: company.name },
            {
              label: "CAC registration number",
              value: <span className="num">{orDash(company.rc_number)}</span>,
            },
            { label: "Tax ID (TIN)", value: <span className="num">{orDash(company.tin)}</span> },
            {
              label: "Address",
              value: <span className="whitespace-pre-line">{orDash(company.address)}</span>,
            },
            { label: "Phone", value: <span className="num">{orDash(company.phone)}</span> },
            { label: "Email", value: orDash(company.email) },
            { label: "Website", value: orDash(company.website) },
          ]}
        />
      </SettingsPanel>

      <section className="space-y-4" aria-labelledby="logo-title">
        <div className="space-y-1">
          <h2 id="logo-title" className="text-h2">
            Logo
          </h2>
          <p className="text-body text-muted-foreground">
            Printed at the top of invoices and PDF reports.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <LogoUploader logoUrl={company.logo_url} companyName={company.name} />
        </div>
      </section>
    </div>
  );
}

export default function CompanyPage() {
  return (
    <Suspense fallback={<SettingsPanelSkeleton rows={7} />}>
      <CompanySection />
    </Suspense>
  );
}
