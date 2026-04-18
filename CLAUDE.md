# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository. Detailed rules are in `.claude/rules/` and are loaded automatically by glob match.

## Overview

Next.js 16 hackathon project. Stack: Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui, Auth.js v5 (OIDC PKCE), Prisma 7 ORM, PostgreSQL. Turbopack is the default bundler.

OIDC provider configured via `AUTH_OIDC_ISSUER` and `AUTH_OIDC_ID`. Profile claims are fetched from the userinfo endpoint in `src/lib/auth.ts`.

## OpenSpec Workflow

Use OpenSpec for all structured feature work:

| Command | Purpose |
|---------|---------|
| `/opsx:explore [topic]` | Explore and think through ideas — read-only |
| `/opsx:propose [name]` | Create a new change and generate all artifacts |
| `/opsx:apply [name]` | Implement tasks from a change |
| `/opsx:archive [name]` | Archive a completed change |

## Rules Summary

Rules in `.claude/rules/` are auto-loaded when matching files are touched. Key rules:

| Rule | Scope |
|------|-------|
| `ui-shadcn-first` | Always use shadcn/ui primitives before custom markup |
| `ui-component-reuse` | Extract reusable components to `src/components/` |
| `ui-url-driven-navigation` | All navigable state (tabs, filters, pagination) must be URL-driven for deep linking |
| `adding-features` | Conventions for new routes, protected paths, database models |
| `prisma7` | Prisma 7 TypeScript-native client — import from `@/generated/prisma/client` |
| `authjs-v5` | Auth.js v5 session callback, userinfo endpoint, OIDC gotchas |
| `genai-llm-integration` | Vercel AI SDK + OpenAI-compatible endpoint only |
| `devcontainer` | Native binary package workarounds for Linux ARM64 |

## Available Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run test` — run tests
- `npm run prisma:migrate` — create a new migration (requires running DB)
- `npm run prisma:studio` — open Prisma Studio (database browser)
- `DATABASE_URL=... npx prisma generate` — regenerate Prisma client (no DB needed)
