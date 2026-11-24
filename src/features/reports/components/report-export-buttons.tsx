"use client";

import { FileSpreadsheetIcon, FileTextIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadExcel } from "@/lib/export/excel";
import { downloadPdf } from "@/lib/export/pdf";
import type { ExportTable } from "@/lib/export/types";

export function ReportExportButtons({ table }: { table: ExportTable }) {
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  async function exportFile(kind: "excel" | "pdf") {
    setExporting(kind);
    try {
      if (kind === "excel") await downloadExcel(table);
      else await downloadPdf(table);
    } catch {
      toast.error(`${kind === "excel" ? "Excel" : "PDF"} export failed. Try again.`);
    } finally {
      setExporting(null);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        pending={exporting === "excel"}
        disabled={exporting !== null}
        onClick={() => void exportFile("excel")}
      >
        <FileSpreadsheetIcon /> Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        pending={exporting === "pdf"}
        disabled={exporting !== null}
        onClick={() => void exportFile("pdf")}
      >
        <FileTextIcon /> PDF
      </Button>
    </div>
  );
}
