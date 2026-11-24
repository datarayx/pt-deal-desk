import type { Metadata } from "next";
import { Suspense } from "react";

import { MoneyText } from "@/components/common/money-text";
import { FeesSheet } from "@/features/settings/components/fees-sheet";
import { SettingsPanel } from "@/features/settings/components/settings-panel";
import { SettingsPanelSkeleton } from "@/features/settings/components/settings-panel-skeleton";
import { DetailList } from "@/components/common/detail-list";
import { getFeeSettings } from "@/features/settings/queries";
import { referralTriggerLabel } from "@/features/settings/settings-values";

export const metadata: Metadata = { title: "Fee defaults · Settings" };

const pct = (v: number) => <span className="num">{v}%</span>;

async function FeesSection() {
  const values = await getFeeSettings();
  const { collateral_fee: collateral } = values.fee_defaults;
  return (
    <SettingsPanel
      title="Fee defaults"
      description="Starting values for P&T's fees on new deals; each deal can still be adjusted. Existing deals keep the fees they were agreed on."
      action={<FeesSheet values={values} />}
      flush
    >
      <DetailList
        rows={[
          {
            label: "Client fee",
            hint: "of the facility amount",
            value: pct(values.fee_defaults.client_fee_pct),
          },
          {
            label: "Provider commission",
            hint: "of the facility amount",
            value: pct(values.fee_defaults.provider_commission_pct),
          },
          {
            label: "Collateral fee",
            hint: collateral.basis === "percent" ? "of the facility amount" : "flat amount",
            value:
              collateral.basis === "percent" ? (
                pct(Number(collateral.value))
              ) : (
                <MoneyText value={String(collateral.value)} />
              ),
          },
          {
            label: "Referral fees earned",
            value: referralTriggerLabel[values.referral_fee_trigger],
          },
          { label: "VAT", value: pct(values.vat_rate_pct) },
          { label: "Withholding tax (WHT)", value: pct(values.wht_rate_pct) },
        ]}
      />
    </SettingsPanel>
  );
}

export default function FeesPage() {
  return (
    <Suspense fallback={<SettingsPanelSkeleton rows={6} />}>
      <FeesSection />
    </Suspense>
  );
}
