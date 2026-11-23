import type * as React from "react";

import { PageHeader } from "@/components/common/page-header";
import { SettingsNav } from "@/components/shell/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Lists and defaults the rest of the app runs on. Changes apply to new records."
      />
      <div className="grid gap-6 lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-10">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
