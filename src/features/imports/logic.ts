import type { ImportDefinition } from "@/features/imports/catalog";

export type ImportSheetData = {
  name: string;
  headers: string[];
  rows: Record<string, string>[];
};

export type ImportValidation = {
  sheet: string;
  row: number;
  errors: string[];
};

export function validateWorkbook(definition: ImportDefinition, sheets: ImportSheetData[]) {
  const errors: ImportValidation[] = [];
  const knownSheets = new Set(definition.sheets.map((sheet) => sheet.name));
  for (const sheet of sheets) {
    const template = definition.sheets.find((candidate) => candidate.name === sheet.name);
    if (!template) {
      errors.push({
        sheet: sheet.name,
        row: 1,
        errors: [`Unexpected sheet. Use one of: ${[...knownSheets].join(", ")}.`],
      });
      continue;
    }
    for (const required of template.required) {
      if (!sheet.headers.includes(required)) {
        errors.push({
          sheet: sheet.name,
          row: 1,
          errors: [`Missing required column: ${required}.`],
        });
      }
    }
    const seenExternalIds = new Set<string>();
    sheet.rows.forEach((row, index) => {
      const rowErrors = template.required
        .filter((required) => !String(row[required] ?? "").trim())
        .map((required) => `${required} is required.`);
      const externalId = String(row.external_id ?? "").trim();
      if (externalId) {
        if (seenExternalIds.has(externalId))
          rowErrors.push(`external_id must be unique in this sheet: ${externalId}.`);
        seenExternalIds.add(externalId);
      }
      if (rowErrors.length) errors.push({ sheet: sheet.name, row: index + 2, errors: rowErrors });
    });
  }
  for (const requiredSheet of definition.sheets) {
    if (!sheets.some((sheet) => sheet.name === requiredSheet.name)) {
      errors.push({ sheet: requiredSheet.name, row: 1, errors: ["This sheet is required."] });
    }
  }
  return errors;
}

export function previewRows(sheets: ImportSheetData[], limit = 50) {
  return sheets.flatMap((sheet) =>
    sheet.rows.slice(0, Math.max(0, limit)).map((payload, index) => ({
      sheet: sheet.name,
      row: index + 2,
      payload,
    })),
  );
}

