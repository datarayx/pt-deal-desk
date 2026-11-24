export type ReminderCondition = "due_7" | "due_3" | "due_0" | "overdue" | "stale_deal";

export function conditionForDaysUntilDue(daysUntilDue: number): ReminderCondition | null {
  if (daysUntilDue === 0) return "due_0";
  if (daysUntilDue === 3) return "due_3";
  if (daysUntilDue === 7) return "due_7";
  return null;
}

export function shouldSendOverdueEmail(weekday: string, configuredWeekdays: readonly string[]) {
  return configuredWeekdays.includes(weekday.toLowerCase());
}

export function isWeeklyStaleEmailDay(weekday: string) {
  return weekday.toLowerCase() === "mon";
}

export function reminderKey(
  target: { scheduleId?: string; dealId?: string },
  condition: ReminderCondition,
  channel: "alert" | "email",
  sentOn: string,
) {
  return [target.scheduleId ?? "", target.dealId ?? "", condition, channel, sentOn].join("|");
}
