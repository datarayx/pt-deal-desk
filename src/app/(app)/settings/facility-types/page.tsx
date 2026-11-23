import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Facility types · Settings" };

export default function SettingsFacilityTypesPage() {
  return (
    <PlaceholderPage
      level="section"
      title="Facility types"
      description="The kinds of funding P&T arranges."
      task="2.1"
      contents="Editable list: LPO financing, asset financing, working capital, project finance and more."
    />
  );
}
