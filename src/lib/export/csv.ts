// CSV export for data tables (Excel/PDF come with task 3.5). Pure: build the text here, the
// browser download lives in the table component.
// - RFC 4180 quoting (commas, quotes, line breaks).
// - Spreadsheet formula injection guard (OWASP): a cell starting with = + - @ tab or CR is
//   prefixed with ' so Excel shows it as text instead of running it. Plain numbers such as
//   "-1500.00" are left alone so amounts stay numeric.

const NUMERIC = /^-?\d+(\.\d+)?$/;
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (FORMULA_START.test(text) && !NUMERIC.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(
  header: readonly string[],
  rows: readonly (readonly (string | number | null | undefined)[])[],
): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

/** "financiers-2026-11-24.csv" — date in Lagos time. */
export function csvFileName(base: string, now: Date = new Date()): string {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(now);
  return `${base}-${day}.csv`;
}
