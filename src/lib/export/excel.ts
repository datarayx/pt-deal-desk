import ExcelJS from "exceljs";

import type { ExportTable } from "@/lib/export/types";

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function safeFileName(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "export"
  );
}

export async function downloadExcel(table: ExportTable) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "P&T Deal Desk";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(table.title.slice(0, 31));
  sheet.addRow([table.companyName ?? "P&T Finance Consult Limited"]);
  sheet.addRow([table.title]);
  sheet.addRow([]);
  const header = sheet.addRow(table.columns);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF011A32" } };
  header.alignment = { vertical: "middle" };
  for (const row of table.rows) sheet.addRow(row.map((cell) => cell ?? ""));
  sheet.views = [{ state: "frozen", ySplit: 4 }];
  sheet.getColumn(1).width = Math.max(14, Math.min(42, table.columns[0]?.length ?? 14));
  for (let index = 2; index <= table.columns.length; index += 1) sheet.getColumn(index).width = 18;
  sheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: Math.max(4, table.rows.length + 4), column: table.columns.length },
  };
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${safeFileName(table.title)}.xlsx`,
  );
}
