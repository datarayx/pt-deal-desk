// Dates (AGENTS.md): display "23 Nov 2026", timezone Africa/Lagos.
//
// Two kinds of input:
//  - calendar dates "YYYY-MM-DD" (due dates, loan dates): a day, not an instant — never shifted
//  - instants (timestamptz ISO strings, Date): shown as the Lagos wall-clock day/time

export const APP_TIME_ZONE = "Africa/Lagos";

export type DateValue = string | Date;

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

const dayFormat = { day: "numeric", month: "short", year: "numeric" } as const;

const lagosDate = new Intl.DateTimeFormat("en-GB", { ...dayFormat, timeZone: APP_TIME_ZONE });
const lagosDateTime = new Intl.DateTimeFormat("en-GB", {
  ...dayFormat,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: APP_TIME_ZONE,
});
// Calendar dates are parsed as UTC midnight, so they must also be formatted in UTC.
const calendarDate = new Intl.DateTimeFormat("en-GB", { ...dayFormat, timeZone: "UTC" });

export function isCalendarDate(value: DateValue): value is string {
  return typeof value === "string" && CALENDAR_DATE.test(value);
}

function toDate(value: DateValue): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export type FormatDateOptions = {
  /** Adds the Lagos time, e.g. "23 Nov 2026, 14:05". Ignored for calendar dates. */
  withTime?: boolean;
};

/** Formats a date for display. Returns null for invalid input. */
export function formatDate(value: DateValue, options: FormatDateOptions = {}): string | null {
  const date = toDate(value);
  if (date === null) return null;
  if (isCalendarDate(value)) return calendarDate.format(date);
  return (options.withTime ? lagosDateTime : lagosDate).format(date);
}

/** Machine-readable value for <time dateTime>. Calendar dates stay as-is; instants become ISO. */
export function toDateTimeAttribute(value: DateValue): string | null {
  if (isCalendarDate(value)) return value;
  return toDate(value)?.toISOString() ?? null;
}
