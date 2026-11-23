// Demo seed runner (task 1.3).
//
//   npm run db:seed            reset + seed the demo database, upload placeholder files, verify
//   npm run db:seed -- --yes   same, skipping the Supabase CLI's "are you sure?" prompt
//
// 1. Refuses unless NEXT_PUBLIC_DEMO_MODE=true (the SQL also refuses if real users exist).
// 2. Runs supabase/seed/seed.sql in one transaction via the Supabase CLI.
// 3. Uploads a small placeholder PDF for every KYC document, credit report, deal document and
//    repayment proof the seed references (private buckets, secret key, server-side only).
// 4. Runs supabase/seed/verify.sql (read-only) and prints each scenario check.
//
// Connection strings and keys come from .env.local and are never printed.

import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

function need(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} in .env.local (see .env.example).`);
    process.exit(1);
  }
  return value;
}

if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
  console.error(
    "Refusing to seed: NEXT_PUBLIC_DEMO_MODE is not 'true'. The seed is for demo databases only.",
  );
  process.exit(1);
}

const dbUrl = need("SUPABASE_DB_URL");
const supabaseUrl = need("NEXT_PUBLIC_SUPABASE_URL");
const secretKey = need("SUPABASE_SECRET_KEY");
const passThrough = process.argv.slice(2);
const cli = join(process.cwd(), "node_modules", "supabase", "dist", "supabase.js");

function runSqlFile(file: string, extra: string[]): { ok: boolean; stdout: string } {
  const result = spawnSync(
    process.execPath,
    [cli, "db", "query", "--file", file, `--remote=${dbUrl}`, ...extra],
    { encoding: "utf8", stdio: ["inherit", "pipe", "pipe"] },
  );
  const scrub = (s: string | null) => (s ?? "").replaceAll(dbUrl, "postgresql://***");
  if (result.status !== 0) {
    console.error([scrub(result.stdout), scrub(result.stderr)].filter(Boolean).join("\n"));
    return { ok: false, stdout: scrub(result.stdout) };
  }
  return { ok: true, stdout: scrub(result.stdout) };
}

// ---------------------------------------------------------------------------
// 1–2. Seed
// ---------------------------------------------------------------------------
console.log("Seeding demo data (one transaction)…");
const seeded = runSqlFile(join("supabase", "seed", "seed.sql"), passThrough);
if (!seeded.ok) {
  console.error("Seed failed — nothing was changed.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 3. Placeholder files
// ---------------------------------------------------------------------------
/** A one-page PDF with a few lines of text (ASCII only; ₦ is written as NGN). */
function placeholderPdf(lines: string[]): Uint8Array {
  const esc = (s: string) => s.replace(/[\\()]/g, (m) => `\\${m}`).replace(/[^\x20-\x7e]/g, "-");
  const text = lines
    .map((line, i) => `BT /F1 ${i === 0 ? 16 : 11} Tf 56 ${770 - i * 22} Td (${esc(line)}) Tj ET`)
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(body);
}

const admin = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type Upload = { bucket: string; path: string; title: string };
const uploads: Upload[] = [];

async function collect(table: string, column: string, bucket: string, title: string) {
  const { data, error } = await admin.from(table).select(column).not(column, "is", null);
  if (error) throw new Error(`${table}: ${error.message}`);
  for (const row of (data ?? []) as unknown as Record<string, string>[]) {
    uploads.push({ bucket, path: row[column], title });
  }
}

await collect("client_documents", "file_path", "kyc", "KYC document");
await collect("credit_checks", "report_file_path", "credit-reports", "Credit bureau report");
await collect("deal_documents", "file_path", "deal-docs", "Deal document");
await collect("deal_requirements", "file_path", "deal-docs", "Financier requirement");
await collect("repayment_reports", "proof_file_path", "repayment-proofs", "Proof of payment");

console.log(`Uploading ${uploads.length} placeholder files…`);
let done = 0;
let failed = 0;
const queue = [...uploads];
async function worker() {
  for (let job = queue.shift(); job; job = queue.shift()) {
    const pdf = placeholderPdf([
      `DEMO - ${job.title}`,
      "P&T Deal Desk demo data. Fictional - not a real document.",
      `File: ${job.path}`,
    ]);
    // Retry with backoff: the free tier's storage service limits concurrent connections
    let lastError: string | null = null;
    for (let attempt = 1; attempt <= 4; attempt++) {
      const { error } = await admin.storage
        .from(job.bucket)
        .upload(job.path, pdf, { contentType: "application/pdf", upsert: true });
      if (!error) {
        lastError = null;
        break;
      }
      lastError = error.message;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt * attempt));
    }
    if (lastError) {
      failed++;
      console.error(`  ${job.bucket}/${job.path}: ${lastError}`);
    } else {
      done++;
    }
  }
}
await Promise.all(Array.from({ length: 3 }, worker));
console.log(`Uploaded ${done} file(s)${failed ? `, ${failed} failed` : ""}.`);

// ---------------------------------------------------------------------------
// 4. Verify
// ---------------------------------------------------------------------------
const verified = runSqlFile(join("supabase", "seed", "verify.sql"), ["--read-only"]);
if (!verified.ok) process.exit(1);
const json = verified.stdout.slice(verified.stdout.indexOf("{"));
const rows = (
  JSON.parse(json) as { rows: { check_name: string; expected: string; actual: string }[] }
).rows;
const width = Math.max(...rows.map((r) => r.check_name.length));
console.log("\nScenario checks:");
for (const r of rows) {
  console.log(`  ${r.check_name.padEnd(width)}  expected ${r.expected.padEnd(16)} got ${r.actual}`);
}
process.exit(failed ? 1 : 0);
