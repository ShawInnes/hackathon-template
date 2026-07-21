# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository. Detailed rules are in `.claude/rules/` and are loaded automatically by glob match.

## Overview

Next.js 16 hackathon project. Stack: Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui, Auth.js v5 (OIDC PKCE), Prisma 7 ORM, PostgreSQL. Turbopack is the default bundler.

OIDC provider configured via `AUTH_OIDC_ISSUER` and `AUTH_OIDC_ID`. Profile claims are fetched from the userinfo endpoint in `src/lib/auth.ts`.

## Mandatory Workflow

Follow this sequence for every non-trivial task. Do not skip steps.

1. **Clarify** — Ask questions to resolve ambiguity. Do not assume intent. If the request is clear and specific, state your understanding and confirm before proceeding.
2. **Plan** — Propose an approach: what changes, which files, what trade-offs. Wait for approval. Use `EnterPlanMode` for multi-file changes.
3. **Implement** — Execute the approved plan. Do not deviate without re-confirming.

Skip to step 3 only for single-line fixes, typos, or tasks where the user gave explicit, unambiguous instructions.

## OpenSpec Workflow

Use OpenSpec for all structured feature work:

| Command | Purpose |
|---------|---------|
| `/opsx:explore [topic]` | Explore and think through ideas — read-only |
| `/opsx:propose [name]` | Create a new change and generate all artifacts |
| `/opsx:apply [name]` | Implement tasks from a change |
| `/opsx:archive [name]` | Archive a completed change |

## Helper Skills

Invoke these skills (via the `Skill` tool) for the patterns below. Each is a self-contained guide with install commands, code patterns, and verification checklist.

| Skill | Use when |
|-------|----------|
| `zod-schemas` | Adding a DTO, server action input, env var, or external API response shape |
| `tanstack-table` | Building a data table with sort/filter/pagination/selection |
| `tanstack-form` | Building a form with 3+ fields or non-trivial validation |
| `tanstack-query` | Adding client-side caching, mutations with optimistic UI, polling, or infinite scroll |
| `code-quality` | Configuring or fixing Prettier / ESLint / lint-staged / pre-commit hooks |
| `secrets-scanning` | Setting up gitleaks, recovering from a leaked secret, adding new env vars |
| `create-nextjs-component` | Creating any new React component |

## Rules Summary

Rules in `.claude/rules/` are either always-active or glob-scoped (loaded when matching files are touched).

### Always active

These rules have no glob — they load in every context:

| Rule | Constraint |
|------|-----------|
| `genai-llm-integration` | Vercel AI SDK + OpenAI-compatible endpoint only. No other LLM SDKs. |
| `ui-url-driven-navigation` | All navigable state (tabs, filters, pagination) must be URL-driven for deep linking. |
| `adding-features` | New routes use `PageLayout` + `auth()`. Protected paths go in `PROTECTED_PATHS`. |
| `check-before-creating` | Search the codebase before creating any new component, utility, hook, or feature. |
| `no-overengineering` | No premature abstractions, unnecessary error handling, or dead code. |
| `no-todos-or-partials` | All code must be fully functional. No TODOs, placeholders, or incomplete features. |
| `no-orphan-features` | Every feature reachable via UI nav from `/`. Replace template placeholders (dashboard, navbar, README, branding) during initial implementation; keep README current after every feature. |
| `commit-after-feature` | Commit immediately after completing any feature, fix, or meaningful change. |
| `dev-server` | Don't run `npm run build` unless necessary. `npm run dev` runs in tmux — check before starting. |
| `zod-schemas` | All DTOs, server action inputs, env vars, and external API responses must be validated with Zod. Types derived via `z.infer`. |
| `code-quality` | Prettier + ESLint + lint-staged + simple-git-hooks + ts-reset. Pre-commit hook is mandatory — never `--no-verify`. |
| `secrets-handling` | No hardcoded secrets. gitleaks runs pre-commit. Env vars only, validated via Zod at module load. |

### Glob-scoped

These load when editing matching files:

| Rule | Triggers on |
|------|-------------|
| `ui-shadcn-first` | `src/components/**`, `src/app/**/*.tsx` |
| `ui-component-reuse` | `src/components/**`, `src/app/**/*.tsx` |
| `prisma` | `prisma/**`, `src/generated/prisma/**`, `src/lib/prisma.ts` |
| `authjs-v5` | `src/lib/auth.ts`, `src/types/next-auth.d.ts` |
| `devcontainer` | `.devcontainer/**`, `package.json` |
| `tanstack-table` | `src/components/**`, `src/app/**/*.tsx` — use for tables with sort/filter/pagination |
| `tanstack-form` | `src/components/**`, `src/app/**/*.tsx` — use for forms with 3+ fields or non-trivial validation |
| `tanstack-query` | `src/components/**`, `src/app/**/*.tsx`, `src/hooks/**` — only when server components are insufficient |

## Available Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run test` — run tests
- `npm run prisma:migrate` — create and apply a new migration (requires running DB); also regenerates the client
- `npm run prisma:generate` — regenerate the Prisma client only (no migration)
- `npm run prisma:seed` — run the seed script to populate required reference data
- `npm run prisma:studio` — open Prisma Studio (database browser)

After any change to `prisma/schema.prisma` or `prisma/migrations/`, run `prisma:migrate` → `prisma:generate` (if needed) → `prisma:seed`. See `.claude/rules/prisma.md` for the full workflow.

<!-- ASTRYX:START -->
Astryx v0.1.7 · 150 components
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

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   150 components by category
  template --list    page + block recipes
  docs <topic>       color, elevation, icons, illustrations, layout, migration, motion, principles, shape, spacing, styling, theme, tokens, typography
  swizzle <Name>     eject component source for deep customization
  upgrade --apply    run after any @astryxdesign/core bump
<!-- ASTRYX:END -->
