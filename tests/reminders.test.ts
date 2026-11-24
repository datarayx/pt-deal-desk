import { describe, expect, it } from "vitest";

import {
  conditionForDaysUntilDue,
  isWeeklyStaleEmailDay,
  reminderKey,
  shouldSendOverdueEmail,
} from "@/features/alerts/logic";

describe("reminder rules", () => {
  it("maps configured due windows to their stable conditions", () => {
    expect(conditionForDaysUntilDue(7)).toBe("due_7");
    expect(conditionForDaysUntilDue(3)).toBe("due_3");
    expect(conditionForDaysUntilDue(0)).toBe("due_0");
    expect(conditionForDaysUntilDue(2)).toBeNull();
  });

  it("only emails overdue reminders on configured weekdays", () => {
    expect(shouldSendOverdueEmail("Mon", ["mon", "thu"])).toBe(true);
    expect(shouldSendOverdueEmail("Wed", ["mon", "thu"])).toBe(false);
  });

  it("uses Monday for the weekly stale-deal email", () => {
    expect(isWeeklyStaleEmailDay("Mon")).toBe(true);
    expect(isWeeklyStaleEmailDay("Thu")).toBe(false);
  });

  it("produces the same dedupe key for a retry", () => {
    const first = reminderKey(
      { scheduleId: "schedule-1", dealId: "deal-1" },
      "overdue",
      "email",
      "2026-11-24",
    );
    const retry = reminderKey(
      { scheduleId: "schedule-1", dealId: "deal-1" },
      "overdue",
      "email",
      "2026-11-24",
    );
    expect(retry).toBe(first);
    expect(reminderKey({ dealId: "deal-1" }, "stale_deal", "alert", "2026-11-24")).not.toBe(first);
  });
});
