import ExcelJS from "exceljs";

import { getClientExportCompany, mergeExportCompany } from "@/lib/export/client-company";
import { excelExportCell, isNegativeExportCell } from "@/lib/export/format";
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
  const company = await getClientExportCompany();
  const brandedTable = mergeExportCompany(table, company) as ExportTable;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "P&T Deal Desk";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(brandedTable.title.slice(0, 31));
  const width = Math.max(1, brandedTable.columns.length);
  sheet.mergeCells(1, 1, 1, width);
  sheet.getCell(1, 1).value = brandedTable.companyName;
  sheet.getCell(1, 1).font = { bold: true, size: 14, color: { argb: "FF011A32" } };
  sheet.mergeCells(2, 1, 2, width);
  sheet.getCell(2, 1).value = [
    brandedTable.companyAddress,
    brandedTable.companyPhone,
    brandedTable.companyEmail,
    brandedTable.companyWebsite,
  ]
    .filter(Boolean)
    .join(" · ");
  sheet.getCell(2, 1).font = { color: { argb: "FF56697F" } };
  sheet.mergeCells(3, 1, 3, width);
  sheet.getCell(3, 1).value = brandedTable.title;
  sheet.addRow([]);
  const header = sheet.addRow(brandedTable.columns);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF011A32" } };
  header.alignment = { vertical: "middle" };
  for (const row of brandedTable.rows) {
    const excelRow = sheet.addRow(row.map((cell) => excelExportCell(cell) ?? ""));
    row.forEach((cell, index) => {
      if (!isNegativeExportCell(cell)) return;
      const excelCell = excelRow.getCell(index + 1);
      excelCell.font = { ...excelCell.font, color: { argb: "FFB42318" } };
      excelCell.numFmt = "#,##0.##;[Red](#,##0.##);-";
    });
  }
  sheet.views = [{ state: "frozen", ySplit: 5 }];
  sheet.getColumn(1).width = Math.max(14, Math.min(42, brandedTable.columns[0]?.length ?? 14));
  for (let index = 2; index <= brandedTable.columns.length; index += 1)
    sheet.getColumn(index).width = 18;
  sheet.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: Math.max(5, brandedTable.rows.length + 5), column: brandedTable.columns.length },
  };

  const logo = brandedTable.companyLogoDataUrl;
  const logoMatch = logo?.match(/^data:image\/(png|jpeg|jpg);base64,/i);
  if (logo && logoMatch) {
    const extension: "jpeg" | "png" = logoMatch[1].toLowerCase() === "jpg" ? "jpeg" : "png";
    const imageId = workbook.addImage({
      base64: logo,
      extension,
    });
    sheet.addImage(imageId, {
      tl: { col: Math.max(0, width - 2), row: 0 },
      ext: { width: 90, height: 54 },
    });
  }
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${safeFileName(brandedTable.title)}.xlsx`,
  );
}

