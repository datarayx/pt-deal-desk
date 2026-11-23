// Applies supabase/migrations to the project database with the Supabase CLI.
//
// Run:  npm run db:push                (reads SUPABASE_DB_URL from .env.local)
//       npm run db:push -- --dry-run   (show what would be applied, change nothing)
//
// The CLI (v3: a Node entry point) is run with this Node binary — no shell — so special
// characters in the database password are passed safely, and the connection string is never
// printed.

import { spawnSync } from "node:child_process";
import { join } from "node:path";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error(
    "Missing SUPABASE_DB_URL in .env.local. Copy it from Supabase → Connect → Session pooler, with your database password filled in.",
  );
  process.exit(1);
}

const cli = join(process.cwd(), "node_modules", "supabase", "dist", "supabase.js");

const result = spawnSync(
  process.execPath,
  [cli, "db", "push", `--remote=${dbUrl}`, ...process.argv.slice(2)],
  { stdio: "inherit" },
);

if (result.error) {
  console.error(`Could not run the Supabase CLI: ${result.error.message}. Try \`npm install\`.`);
  process.exit(1);
}
process.exit(result.status ?? 1);
