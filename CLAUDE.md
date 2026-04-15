# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Overview

This is a Next.js 16 hackathon project. The stack is: Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui, Auth.js v5 (OIDC PKCE), Prisma 7 ORM, PostgreSQL. Turbopack is the default bundler.

The OIDC provider is configured via `AUTH_OIDC_ISSUER` and `AUTH_OIDC_ID`. Many OIDC providers do not include profile claims in the ID token — they are fetched separately from the userinfo endpoint in `src/lib/auth.ts`.

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

## Prisma 7

This project uses Prisma 7 with the new TypeScript-native client generator.

- **Generator**: `provider = "prisma-client"` with `output = "../src/generated/prisma"` — NOT the old `prisma-client-js`
- **Import path**: `import { PrismaClient } from "@/generated/prisma/client"` — NOT `@prisma/client`
- **Driver adapter**: Uses `@prisma/adapter-pg` (pg driver) — the new client has no binary query engine. The `DATABASE_URL` is passed via `new PrismaPg({ connectionString })` in `src/lib/prisma.ts`.
- **Generated files**: `src/generated/prisma/` is gitignored — regenerate with `npm run prisma:migrate` or `DATABASE_URL=... npx prisma generate`
- **Config file**: `prisma.config.ts` in the project root configures the datasource URL and schema path
- **`@auth/prisma-adapter`** requires `prisma as any` cast since it still types against `@prisma/client`

## Auth.js v5

- **Session callback is required** to expose `user.id`: without it, `session.user.id` is always undefined
- **TypeScript types**: `src/types/next-auth.d.ts` augments the session to include `user.id`
- **`profile()` on custom OIDC providers is unreliable** in Auth.js v5 — do not rely on it. Profile data is fetched manually in the `signIn` callback instead.
- **Userinfo endpoint**: The `signIn` callback in `src/lib/auth.ts` manually calls the userinfo endpoint (discovered from `.well-known/openid-configuration`) using the `access_token` and writes the result directly to the database.

## Devcontainer

- The devcontainer mounts the host `node_modules` via volume. Native binary packages installed on macOS won't have their Linux ARM64 variants present in the container.
- Fix: add the Linux ARM64 package as an explicit `optionalDependencies` entry (e.g. `lightningcss-linux-arm64-gnu`). npm will then include it in `package-lock.json` and install it inside the container.

## Available Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run test` — run tests
- `npm run prisma:migrate` — create a new migration (requires running DB)
- `npm run prisma:studio` — open Prisma Studio (database browser)
- `DATABASE_URL=... npx prisma generate` — regenerate Prisma client (no DB needed)
