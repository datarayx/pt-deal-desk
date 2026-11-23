import type { Metadata } from "next";
import { Suspense } from "react";

import { RemindersSheet } from "@/features/settings/components/reminders-sheet";
import { SettingsPanel } from "@/features/settings/components/settings-panel";
import { SettingsPanelSkeleton } from "@/features/settings/components/settings-panel-skeleton";
import { SettingsSummary } from "@/features/settings/components/settings-summary";
import { getReminderSettings } from "@/features/settings/queries";
import { reminderDayLabel, weekdayLabel } from "@/features/settings/settings-values";

export const metadata: Metadata = { title: "Reminder timings · Settings" };

function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

async function RemindersSection() {
  const values = await getReminderSettings();
  return (
    <SettingsPanel
      title="Reminder timings"
      description="When repayment reminders, overdue summaries and stale-deal alerts go out to the notification recipients."
      action={<RemindersSheet values={values} />}
      flush
    >
      <SettingsSummary
        rows={[
          {
            label: "Repayment reminders",
            value: joinList(
              values.reminder_days_before_due.map((d, i) =>
                i === 0 ? reminderDayLabel(d) : reminderDayLabel(d).toLowerCase(),
              ),
            ),
          },
          {
            label: "Overdue summaries",
            value: `Every ${joinList(values.overdue_email_weekdays.map((d) => weekdayLabel[d]))}`,
          },
          {
            label: "Stale deal after",
            value: (
              <span className="num">{values.stale_deal_days} days without a stage change</span>
            ),
          },
        ]}
      />
    </SettingsPanel>
  );
}

export default function RemindersPage() {
  return (
    <Suspense fallback={<SettingsPanelSkeleton rows={3} />}>
      <RemindersSection />
    </Suspense>
  );
}
