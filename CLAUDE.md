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

### Glob-scoped

These load when editing matching files:

| Rule | Triggers on |
|------|-------------|
| `ui-shadcn-first` | `src/components/**`, `src/app/**/*.tsx` |
| `ui-component-reuse` | `src/components/**`, `src/app/**/*.tsx` |
| `prisma7` | `prisma/**`, `src/generated/prisma/**`, `src/lib/prisma.ts` |
| `authjs-v5` | `src/lib/auth.ts`, `src/types/next-auth.d.ts` |
| `devcontainer` | `.devcontainer/**`, `package.json` |

## Available Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run test` — run tests
- `npm run prisma:migrate` — create a new migration (requires running DB)
- `npm run prisma:studio` — open Prisma Studio (database browser)
- `DATABASE_URL=... npx prisma generate` — regenerate Prisma client (no DB needed)
