# CLAUDE.md

Next.js 16 App Router hackathon project. TypeScript, Astryx design system (`@astryxdesign/core`, Tailwind as a token-backed escape hatch), Auth.js v5 (OIDC PKCE — see `authjs-v5` rule), Prisma 7 ORM, PostgreSQL. Turbopack is the default bundler.

Detailed rules live in `.claude/rules/` and load automatically — each file's frontmatter carries its own `description` and (if scoped) `globs`; a file with no `globs` is always active. This CLAUDE.md is an index, not a mirror of that content.

## Workflow

Default to implementing directly — this is a hackathon, optimise for speed. Only ask a clarifying question first if the request is genuinely ambiguous (conflicting requirements, no reasonable default); otherwise pick the sensible default and go. Don't restate your understanding before starting, and don't stop for plan approval on multi-file changes — the diff is the plan. Offload research/exploration to subagents (`Explore`) to keep context clean. Run the commands in `## Verification` after you're done, not as a gate before starting.

## Helper Skills

Invoke these skills (via the `Skill` tool) for the patterns below. Each is a self-contained guide with install commands, code patterns, and verification checklist. Patterns for Zod, TanStack Form/Query/Table, code quality, and worker jobs live in the matching `.claude/rules/*.md` file instead — those load automatically when you touch relevant files, no explicit invoke needed.

| Skill | Use when |
|-------|----------|
| `secrets-scanning` | Setting up gitleaks, recovering from a leaked secret, adding new env vars |
| `create-nextjs-component` | Creating any new React component |

## Rules

Always active — read their frontmatter for the exact constraint: `genai-llm-integration`, `ui-url-driven-navigation`, `adding-features`, `check-before-creating`, `no-overengineering`, `no-todos-or-partials`, `no-orphan-features`, `commit-after-feature`, `dev-server`, `zod-schemas`, `code-quality`, `secrets-handling`.

Loaded when touching matching files — `src/components/**` / `src/app/**/*.tsx`: `ui-astryx-first`, `ui-component-reuse`, `ui-scroll-patterns`, `tanstack-table`, `tanstack-form`, `tanstack-query`. Other scopes: `prisma` (`prisma/**`), `authjs-v5` (`src/lib/auth.ts`), `devcontainer` (`.devcontainer/**`, `package.json`).

## Prisma Workflow

After any change to `prisma/schema.prisma` or `prisma/migrations/`: `npm run prisma:migrate` → `npm run prisma:generate` (if migrate was skipped) → `npm run prisma:seed`. Full workflow in `.claude/rules/prisma.md`.

## Verification

Run before calling a task done:

- `npm run typecheck` — TypeScript, no emit
- `npm run lint` — ESLint
- `npm run format:check` — Prettier
- `npm run test` — Vitest
- `npm run lint:prisma` — schema lint (only if `prisma/schema.prisma` changed)

Pre-commit already runs lint-staged + gitleaks — never bypass with `--no-verify`. Do not run `npm run build` (see `dev-server` rule).

<!-- ASTRYX:START -->
Astryx v0.1.8 · 153 components
CLI: run every command as `npx astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — discover, don't guess. Before writing UI:
1. `astryx build "<idea>"` — START HERE: returns a kit (closest [page] + [block]s + [component]s). No args = full playbook.
2. `astryx template <name> [--skeleton]` — scaffold the [page]/[block]s it named, or study their layout. Templates are reference code.
3. `astryx component <Name>` — props + examples for every component you use.

RULES:
- No <div> — components do all layout/spacing. Full page → AppShell; sidebar nav → SideNav.
- Frame first: pick the shell (AppShell / Layout+LayoutPanel) and budget regions in px BEFORE writing content (`astryx docs layout`).
- Dense data = rows (Table, List/Item) edge-to-edge — never Card-wrapped list items. Card = dashboard widgets, galleries, settings groups only.
- Status → StatusDot/Token; Badge only for counts and enumerated states, never decoration.
- Custom styling: component props first; else Tailwind utilities backed by tokens (bg-surface, text-primary, rounded-lg) via tailwind-theme.css. No raw hex/px.
- Tokens for every value (`astryx docs tokens`). Brand/accent via `astryx theme` — never override --color-* in :root.
- SELF-CHECK before you finish: re-read the file and replace any style={{…}}, raw <div>/<span> layout, imported .css/@apply, or hardcoded/arbitrary value (e.g. bg-[#fff], p-[13px]) with the component or a token-backed utility. If unsure a component/prop exists, run `astryx component <Name>` / `astryx search "<thing>"`; don't hand-roll CSS.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   153 components by category
  template --list    page + block recipes
  docs <topic>       color, elevation, icons, illustrations, internationalization, layout, migration, motion, principles, shape, spacing, styling, theme, tokens, typography
  swizzle <Name>     eject component source for deep customization
  upgrade --apply    run after any @astryxdesign/core bump
<!-- ASTRYX:END -->
