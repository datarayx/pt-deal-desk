import type { ExportCell } from "@/lib/export/types";

const negativeNumberPattern = /^-\d+(?:\.\d+)?$/;

function numericString(value: ExportCell): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const clean = value.trim();
  if (!negativeNumberPattern.test(clean)) return null;

  const number = Number(clean);
  return Number.isFinite(number) ? number : null;
}

export function isNegativeExportCell(value: ExportCell): boolean {
  const number = numericString(value);
  return number !== null && number < 0;
}

export function pdfExportCell(value: ExportCell): string {
  if (value === null || value === undefined) return "";
  if (!isNegativeExportCell(value)) return String(value);

  const text = String(value).trim();
  return `(${text.slice(1)})`;
}

export function excelExportCell(value: ExportCell): ExportCell {
  const number = numericString(value);
  return number === null ? value : number;
}

