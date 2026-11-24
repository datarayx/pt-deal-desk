export type ExportCell = string | number | null | undefined;

export type ExportTable = {
  title: string;
  columns: string[];
  rows: ExportCell[][];
  companyName?: string;
  companyAddress?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
};
