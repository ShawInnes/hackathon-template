# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Overview

This is a Next.js 16 hackathon project. The stack is: Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui, Auth.js v5 (OIDC PKCE), Prisma ORM, PostgreSQL. Turbopack is the default bundler.

## OpenSpec Workflow

Use OpenSpec for all structured feature work:

| Command | Purpose |
|---------|---------|
| `/opsx:explore [topic]` | Explore and think through ideas — read-only |
| `/opsx:propose [name]` | Create a new change and generate all artifacts |
| `/opsx:apply [name]` | Implement tasks from a change |
| `/opsx:archive [name]` | Archive a completed change |

## UI Rules

**These rules are mandatory. Do not skip them.**

1. **shadcn/ui first.** Always use shadcn/ui primitives for UI elements. Before writing any custom markup for buttons, cards, inputs, dialogs, dropdowns, avatars, or separators — install the shadcn component first:
   ```bash
   npx shadcn add <component-name>
   ```
   Never write raw HTML for elements that shadcn covers.

2. **Component reuse.** Before implementing any feature with a UI element, ask: should this be a reusable component in `src/components/`? If the element will appear in more than one place, or if extracting it would make the page cleaner, create a component. Use `/create-nextjs-component` to scaffold it.

## Adding Features

- New routes: create `src/app/<route>/page.tsx`. Wrap in `<PageLayout>` and call `auth()` at the top.
- Protect a route: add its path to the `PROTECTED_PATHS` array in `src/proxy.ts`.
- New database model: add it to `prisma/schema.prisma` below the comment line, then run `npm run prisma:migrate`.

## Available Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run test` — run tests
- `npm run prisma:migrate` — create a new migration
- `npm run prisma:studio` — open Prisma Studio (database browser)
