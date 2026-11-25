import { NextResponse } from "next/server";

import { getExportCompanyProfile } from "@/lib/export/company";

export async function GET() {
  try {
    return NextResponse.json(await getExportCompanyProfile(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Company profile could not be loaded." }, { status: 500 });
  }
}

