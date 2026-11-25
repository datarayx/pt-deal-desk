export type ExportCell = string | number | null | undefined;

export type ExportCompany = {
  companyName: string;
  companyAddress: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  companyWebsite: string | null;
  companyRcNumber: string | null;
  companyTin: string | null;
  companyLogoDataUrl: string | null;
};

export type ExportTable = {
  title: string;
  columns: string[];
  rows: ExportCell[][];
  companyName?: ExportCompany["companyName"];
  companyAddress?: ExportCompany["companyAddress"];
  companyEmail?: ExportCompany["companyEmail"];
  companyPhone?: ExportCompany["companyPhone"];
  companyWebsite?: ExportCompany["companyWebsite"];
  companyRcNumber?: ExportCompany["companyRcNumber"];
  companyTin?: ExportCompany["companyTin"];
  companyLogoDataUrl?: ExportCompany["companyLogoDataUrl"];
};
