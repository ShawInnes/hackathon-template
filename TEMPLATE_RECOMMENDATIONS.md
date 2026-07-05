# Hackathon Template — Recommendations

Findings from building a full feature (multi-model roleplay chat app, ~40 tasks: Prisma
models, server actions, TanStack Form/Table UI, streaming AI SDK routes, anonymous
session auth) on top of this template in a fresh clone. Grouped by priority. Each item
lists the concrete symptom, the affected file(s), and a suggested fix.

---

## 1. Bugs (hit these on a stock clone, no feature code involved)

### 1.1 `prisma db seed` fails out of the box — missing `tsx` dependency
`prisma.config.ts` wires the seed command to `tsx prisma/seed.ts`, but `tsx` is not listed
in `package.json` (dependencies or devDependencies). Running `npm run prisma:seed` on a
fresh clone fails immediately with `spawn tsx ENOENT`.

- **Files**: `prisma.config.ts`, `package.json`
- **Fix**: `npm install --save-dev tsx` and commit the lockfile change.

### 1.2 Importing from the `@/generated/zod` barrel breaks client bundling
`src/generated/zod/index.ts` re-exports everything under `modelSchema/` and
`inputTypeSchemas/`. Several of those files transitively import
`@prisma/client/runtime/client.mjs` (via `prismaNamespace.ts`). If any **client component**
imports so much as an enum schema from the barrel (`import { X } from "@/generated/zod"`),
Turbopack tries to bundle the Prisma runtime for the browser and fails with:

```
the chunking context (unknown) does not support external modules (request: node:module)
```

This is easy to hit by accident — an enum schema feels harmless to import — and the error
message gives no hint that the barrel is the problem.

- **Fix options** (pick one):
  1. Document the landmine in `.claude/rules/prisma.md`: "Never import from the
     `@/generated/zod` barrel in client-bundled code — import the specific
     `@/generated/zod/inputTypeSchemas/<X>Schema` or `modelSchema/<X>Schema` file instead."
  2. Split the generated barrel so enum/input-type schemas (no Prisma runtime dependency)
     are exported from a separate, client-safe entry point.

### 1.3 `prisma/seed.ts` ships with dead commented-out code
The template's own rules (`no-overengineering.md`: "no commented-out blocks";
`no-todos-or-partials.md`: "no placeholder comments") are violated by the template itself —
`prisma/seed.ts` has a large commented-out example block referencing a nonexistent
`employee`/`roleType` model. Confusing for a fresh clone, and it's the first thing a new
project's Prisma workflow touches.

- **File**: `prisma/seed.ts`
- **Fix**: Replace with either a working minimal example (e.g. seed nothing, just log) or
  delete the dead block entirely.

---

## 2. Portability gaps (environment-dependent, will bite in restricted/CI/remote environments)

### 2.1 shadcn CLI requires network access to `ui.shadcn.com`, template ships too few primitives
The template only includes 7 shadcn components (`button`, `card`, `dropdown-menu`,
`avatar`, `separator`, `skeleton`, `sonner`). Any nontrivial feature needs at minimum
`input`, `label`, `textarea`, `select`, `dialog`, `table`, `badge` — none of which are
present. In network-restricted environments (this one included — `ui.shadcn.com` was
blocked by policy), `npx shadcn add <component>` fails outright, forcing hand-authored
recreations of each primitive against the `@base-ui/react` + `base-nova` style by reading
the existing components as reference.

- **Also verify**: is `"style": "base-nova"` in `components.json` a shadcn Pro/paid
  registry style? If so, `npx shadcn add` may fail for any team without that specific
  registry access, independent of network policy — worth confirming this works from a
  clean shadcn account before relying on it as the default.
- **Fix**: Either vendor a broader baseline set of primitives (input, label, textarea,
  select, dialog, table, badge at minimum) into the template so `ui-shadcn-first.md`'s
  "install with `npx shadcn add`" instruction has a fallback, or explicitly document the
  network dependency and a manual-authoring fallback pattern.

### 2.2 Local dev DB setup assumes devcontainer or Docker, with no fallback
`.env.example`'s `DATABASE_URL` hardcodes host `db` ("pre-configured for devcontainer").
In an environment with neither the devcontainer network nor a running Docker daemon
(this one had `docker ps` fail with no daemon socket), there's no documented path — I had
to discover Postgres 16 was installed as a bare binary, start the service manually, set a
password, create the database, and repoint `DATABASE_URL` to `localhost`.

- **Files**: `.env.example`, `.devcontainer/docker-compose.yml`, root `docker-compose.yml`
- **Fix**: A `predev`-style detection script (devcontainer → docker-compose → bare
  postgres → clear error message) would make the template work in more environments
  without a human debugging session first.

### 2.3 No version pinning on fast-moving dependencies
Next 16, React 19, Zod 4, Tailwind 4, and especially the Vercel AI SDK (`ai@^7`,
`@ai-sdk/openai@^4`) are all on wide `^` ranges. The `genai-llm-integration.md` rule
documents an API surface labeled "v4" (`DefaultChatTransport`, `convertToModelMessages`
returning a Promise, `useChat` with `transport`) — this still matched the installed
`ai@7.0.15` when I checked the `.d.ts` files directly, but the AI SDK's API has changed
significantly across versions historically, and nothing pins the range or notes which
exact version the rule was verified against.

- **Files**: `package.json`, `.claude/rules/genai-llm-integration.md`
- **Fix**: Either tighten the AI SDK version ranges, or add a comment to the rule noting
  the npm version it was last verified against, so drift is easier to detect.

---

## 3. Scalability suggestions

### 3.1 Env validation is lazy, not boot-time
Nothing validates `OPENAI_API_KEY`/`OPENAI_BASE_URL`-style env vars at `npm run dev`
startup. A project-specific `src/lib/env.ts` (the pattern `zod-schemas.md` recommends)
only throws the first time a route that imports it runs — so a missing key surfaces as a
500 deep in a request instead of a clear failure at boot.

- **Fix**: Extend the existing `predev` script (which already checks `DATABASE_URL` before
  running migrations) to also validate any project-defined required env vars, or document
  the pattern of importing `src/lib/env.ts` from a startup hook.

### 3.2 No shared rate-limiting/lockout primitive
Any feature with a login, PIN, or abuse-prone endpoint needs attempt-counting and
lockout — I hand-rolled a Postgres-column-based version (`failedAttempts` +
`lockedUntil` columns, checked and incremented per request) for one feature. This is a
common enough pattern that a small shared helper (`src/lib/rate-limit.ts`) would save
every team that needs it from reinventing it under time pressure.

### 3.3 No CI workflow
No `.github/workflows` present. Even a minimal typecheck + lint + test gate on PRs would
catch regressions that local hackathon-speed development won't.

---

## 4. Minor / worth a look

- **`AGENTS.md` vs `CLAUDE.md`**: both exist as separate files. Worth confirming they're
  meant to diverge (different audiences) or should be kept in sync mechanically (one
  re-exporting/including the other) rather than risking silent drift.
- **`.prismalintrc.json`** is minimal (4 rules). Fine for hackathon scope, but consider
  whether relation-naming or cascade-behavior lint rules would catch common schema
  mistakes early.
