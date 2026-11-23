import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = { title: "Deal stages · Settings" };

export default function SettingsStagesPage() {
  return (
    <PlaceholderPage
      level="section"
      title="Deal stages"
      description="The pipeline every deal moves through."
      task="2.1"
      contents="Stage list with drag-to-reorder, colours and terminal stages."
    />
  );
}
