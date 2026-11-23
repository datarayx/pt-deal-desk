// Creates (or updates) the two demo sign-ins from docs/SEED_DATA.md:
//   CEO         DEMO_CEO_EMAIL         / DEMO_CEO_PASSWORD
//   Accountant  DEMO_ACCOUNTANT_EMAIL  / DEMO_ACCOUNTANT_PASSWORD
//
// Run:  npm run demo:users        (reads .env.local; needs SUPABASE_SECRET_KEY)
//
// The role goes into app_metadata, which only the secret key can set; the database trigger
// turns it into an active profile. Safe to re-run: existing users get their password, name and
// role reset to the values below.

import { createClient, type User } from "@supabase/supabase-js";

type DemoUser = { email: string; password: string; fullName: string; role: "ceo" | "accountant" };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Add it to .env.local (see .env.example).`);
    process.exit(1);
  }
  return value;
}

const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const secretKey = requireEnv("SUPABASE_SECRET_KEY");

const demoUsers: DemoUser[] = [
  {
    email: requireEnv("DEMO_CEO_EMAIL").toLowerCase(),
    password: requireEnv("DEMO_CEO_PASSWORD"),
    fullName: "Ngozi Adeyemi", // fictional
    role: "ceo",
  },
  {
    email: requireEnv("DEMO_ACCOUNTANT_EMAIL").toLowerCase(),
    password: requireEnv("DEMO_ACCOUNTANT_PASSWORD"),
    fullName: "Tunde Bakare", // fictional
    role: "accountant",
  },
];

for (const user of demoUsers) {
  if (user.password.length < 10) {
    console.error(`Password for ${user.email} must be at least 10 characters.`);
    process.exit(1);
  }
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email: string): Promise<User | undefined> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match || data.users.length < 200) return match;
  }
  return undefined;
}

for (const demo of demoUsers) {
  const attributes = {
    password: demo.password,
    email_confirm: true,
    app_metadata: { role: demo.role },
    user_metadata: { full_name: demo.fullName },
  };

  const existing = await findUserByEmail(demo.email);
  let userId: string;

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, attributes);
    if (error) throw error;
    userId = existing.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: demo.email,
      ...attributes,
    });
    if (error) throw error;
    userId = data.user.id;
  }

  // The trigger only runs on insert; make sure the profile matches on re-runs too.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: demo.fullName, role: demo.role, is_active: true })
    .eq("id", userId);
  if (profileError) throw profileError;

  console.log(`${existing ? "Updated" : "Created"} ${demo.role.padEnd(10)} ${demo.email}`);
}

console.log("Done. Sign in at /login.");
