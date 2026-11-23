# P&T Deal Desk — Vibe-Coding Starter Kit

Prepared by Datarayx Insight. Drop this whole folder into an empty project folder **before** you open your AI coding tool (Claude Code, Cursor, Windsurf, Lovable, Bolt, v0…).

The AI builds best when it can read clear, specific documents instead of guessing. Each file below answers one question the AI would otherwise invent an answer to.

## Folder layout

```
pt-deal-desk/
├── README.md              ← this file: what's here and how to use it
├── AGENTS.md              ← the AI's rulebook (stack, conventions, do/don't). Copy as CLAUDE.md / .cursorrules too
├── PROMPTS.md             ← the prompts to paste, in order, from start to finish
├── TASKS.md               ← the build checklist the AI ticks off as it goes
├── DECISIONS.md           ← a running log of decisions, so the AI never re-argues them
└── docs/
    ├── PRD.md             ← WHAT to build: users, modules, features, acceptance criteria
    ├── DESIGN.md          ← HOW IT LOOKS: brand, colour tokens, type, spacing, components, UI rules
    ├── SCREENS.md         ← every screen, what's on it, who sees it
    ├── DATA_MODEL.md      ← tables, fields, relationships, enums
    ├── WORKFLOWS.md       ← deal pipeline, repayments, reminders, fee triggers
    ├── ACCOUNTING.md      ← chart of accounts, posting rules, report formats
    ├── SECURITY.md        ← roles, row-level security, data protection (NDPA)
    └── SEED_DATA.md       ← the realistic Nigerian sample data for the demo
```

## The 3 rules that make vibe-coding work

1. **Docs first, code second.** The AI reads the docs before every big step. If something changes, change the doc first, then ask the AI to update the code.
2. **One feature per prompt.** Small, finished, tested steps. Never "build the whole app".
3. **Commit after every working step** (`git commit`), so you can always roll back when the AI breaks something.

## How to start

1. Create an empty folder, copy this kit in, run `git init`.
2. Open it in your AI coding tool.
3. Open `PROMPTS.md` and paste Prompt 0. Go in order.

## Running the app

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL, keys, `SUPABASE_DB_URL` and the two demo passwords (at least 10 characters).
3. `npm run db:push` — apply the database migrations in `supabase/migrations/`.
4. `npm run demo:users` — create the demo CEO and Accountant sign-ins.
5. `npm run db:seed` — reset and load the demo data (demo databases only; it refuses otherwise).
6. `npm run dev` — open http://localhost:3000 and sign in with a demo account.

Other scripts: `npm run db:types` (regenerate `src/types/database.ts` after a migration), `npm test`, `npm run lint`, `npm run build`.
