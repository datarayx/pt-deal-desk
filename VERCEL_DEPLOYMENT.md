# Vercel deployment handoff

This project is a Next.js App Router application backed by Supabase. The Vercel project root is the repository root (`pt-deal-desk`), the framework preset is **Next.js**, and the build command is `npm run build`. The app requires Node.js `>=20.9.0`; use the current Vercel Node.js runtime or pin Node 24 for parity with the local demo setup.

## Environment variables

Set these in Vercel Project Settings → Environment Variables. Keep Production, Preview, and Development values scoped separately where appropriate.

| Variable | Vercel type | Scope | Required when | Value |
|---|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Config | Production, Preview | Always | The public app URL, for example `https://deal-desk.example.com`; use the preview URL for a preview environment. |
| `NEXT_PUBLIC_DEMO_MODE` | Config | Preview/demo Production | Demo walkthrough | `true` to show the CEO and Accountant demo sign-in cards and keep reminder emails in Outbox. Set `false` for a non-demo production deployment. |
| `NEXT_PUBLIC_SUPABASE_URL` | Config | Production, Preview | Always | Supabase Project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Config | Production, Preview | Always | Supabase publishable key (`sb_publishable_...`). Safe for browser use; database RLS is the security boundary. |
| `SUPABASE_SECRET_KEY` | Secret | Production, Preview | CEO user/settings administration | Supabase secret key (`sb_secret_...`). Server-only; never expose it as `NEXT_PUBLIC_*`. |
| `DEMO_CEO_EMAIL` | Config | Preview/demo Production | `NEXT_PUBLIC_DEMO_MODE=true` | `ceo@demo.ptdealdesk.ng` or the seeded CEO email. |
| `DEMO_CEO_PASSWORD` | Secret | Preview/demo Production | `NEXT_PUBLIC_DEMO_MODE=true` | The password used by `npm run demo:users`. |
| `DEMO_ACCOUNTANT_EMAIL` | Config | Preview/demo Production | `NEXT_PUBLIC_DEMO_MODE=true` | `accountant@demo.ptdealdesk.ng` or the seeded Accountant email. |
| `DEMO_ACCOUNTANT_PASSWORD` | Secret | Preview/demo Production | `NEXT_PUBLIC_DEMO_MODE=true` | The password used by `npm run demo:users`. |
| `RESEND_API_KEY` | Secret | Production | Only when demo mode is off and real email sending is enabled | Resend API key. Omit for the demo; demo reminders are not sent. |
| `EMAIL_FROM` | Config | Production | Only when real email sending is enabled | Verified sender, for example `P&T Finance Consult <no-reply@example.com>`. |

The following variables are for controlled local or CI database operations, not normal Vercel runtime configuration:

- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_DB_URL`

Do not put database passwords, Supabase secret keys, demo passwords, or Resend keys in `NEXT_PUBLIC_*` variables or in the repository.

## Supabase setup before the first deployment

1. Apply the migrations and seed the demo project from a controlled machine with `npm run db:push`, `npm run db:seed`, and `npm run demo:users`. The seed is deliberately restricted to demo mode.
2. In Supabase Auth URL Configuration, set the Site URL to the value of `NEXT_PUBLIC_SITE_URL`.
3. Add the callback URL for this app: `${NEXT_PUBLIC_SITE_URL}/auth/callback`. Add the equivalent Preview callback URL(s) if Preview deployments will be tested.
4. Confirm the CEO and Accountant demo users exist before sharing the demo URL.

## Pre-deployment checks

Run from the repository root:

```text
npm ci
npm run typecheck
npm run lint
npm test -- --run
npm run build
```

The live Supabase checks are intentionally separate from the Vercel build because they authenticate against seeded data and need local demo credentials:

```text
npm run test:integration
```

Run that command only from a controlled environment with `.env.local`; it is read-only but should not be part of an untrusted deployment build.

## Vercel project settings

- Root Directory: repository root (`pt-deal-desk`)
- Framework Preset: Next.js
- Install Command: `npm ci` (default is also acceptable)
- Build Command: `npm run build`
- Output Directory: default Next.js output
- Production Branch: `main`

Create a Preview deployment first, run the walkthrough in `DEMO_SCRIPT.md`, then promote the verified build to Production. Database migrations should be applied before the deployment that depends on them; do not run migrations from the Vercel build command.
