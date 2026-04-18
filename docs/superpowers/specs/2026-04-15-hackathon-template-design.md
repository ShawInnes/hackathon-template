# Hackathon Template — Design Spec

**Date:** 2026-04-15
**Status:** Approved

## Overview

A Bitbucket template repository for hackathon teams. Teams fork the repo, open it in a Coder workspace (or VS Code with Dev Containers), fill in three environment variables, and have a fully running Next.js app with authentication and a database in minutes.

---

## 1. Repository Structure

```
hackday-template/
├── .claude/
│   ├── skills/
│   │   ├── openspec-explore/
│   │   ├── openspec-propose/
│   │   ├── openspec-apply-change/
│   │   ├── openspec-archive-change/
│   │   ├── commit-commands/
│   │   ├── create-nextjs-component/
│   │   └── superpowers-systematic-debugging/
│   └── commands/
│       └── opsx/
│           ├── explore.md
│           ├── propose.md
│           ├── apply.md
│           └── archive.md
├── .devcontainer/
│   ├── devcontainer.json
│   └── docker-compose.yml
├── openspec/
│   └── config.yaml
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                   # Public landing page
│   │   ├── dashboard/
│   │   │   └── page.tsx               # Protected dashboard
│   │   └── api/
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts
│   ├── components/
│   │   ├── ui/                        # shadcn/ui primitives
│   │   ├── navbar.tsx
│   │   ├── page-layout.tsx
│   │   └── sign-in-card.tsx
│   ├── lib/
│   │   ├── auth.ts                    # Auth.js config
│   │   ├── prisma.ts                  # Prisma client singleton
│   │   └── utils.ts                   # shadcn cn() helper
│   └── proxy.ts                       # Route protection (Next.js 16)
├── .env.example
├── .gitignore
├── CLAUDE.md
├── README.md
├── components.json                    # shadcn/ui config
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 2. Devcontainer

Docker Compose-based devcontainer with two services:

- **`web`** — Node 24, mounts the workspace, runs `npm install && npx prisma migrate deploy && npm run dev` on start
- **`db`** — Postgres 16, data persisted to a named volume

**Ports exposed:**
- `3000` — Next.js dev server
- `5432` — Postgres
- `5555` — Prisma Studio

**Coder compatibility:** The devcontainer spec is standard and works directly with Coder workspace templates. No Coder-specific config required in the template itself.

---

## 3. Authentication

Auth.js v5 with the Oidc provider using PKCE (no client secret required).

**Why PKCE:** Oidc supports Authorization Code Flow with PKCE for public clients. This allows hackathon organisers to issue a `CLIENT_ID` only — no secret to distribute or rotate. The Oidc application must be configured as a public client (SPA or Web app with PKCE enabled) by the organiser.

**Required environment variables:**
```
OIDC_CLIENT_ID=           # Issued per-team by hackathon organiser
OIDC_ISSUER=              # e.g. https://your-org.oidc.com
AUTH_SECRET=              # Random string for session signing (teams generate this)
DATABASE_URL=             # Pre-set in .env.example for devcontainer Postgres
```

**Auth.js config (`src/lib/auth.ts`):**
- Oidc provider with `checks: ["pkce", "state"]`, no `clientSecret`
- Prisma adapter for session/user persistence
- Session strategy: database

**Route protection (`src/proxy.ts`):**
- Next.js 16 convention — `middleware.ts` is deprecated, renamed to `proxy.ts`, function exported as `proxy`
- Optimistic cookie-based check in proxy; pages call `auth()` directly as the authoritative validation
- Teams add paths to `PROTECTED_PATHS` array to protect new routes — no per-page boilerplate

**Starter pages:**
- `/` — Public landing page with "Sign in with Oidc" button
- `/dashboard` — Protected, redirects to `/` if unauthenticated

---

## 4. Database & Prisma

Prisma ORM with PostgreSQL.

**Schema (`prisma/schema.prisma`):**
- Auth.js adapter tables only: `User`, `Account`, `Session`, `VerificationToken`
- Comment block showing teams how to add their own models
- No example domain models — clean slate for teams

**Prisma client (`src/lib/prisma.ts`):**
- Singleton pattern safe for Next.js hot reload (prevents connection pool exhaustion)

**`package.json` scripts:**
```json
"dev":             "next dev",
"build":           "next build",
"prisma:migrate":  "prisma migrate dev",
"prisma:studio":   "prisma studio",
"prisma:deploy":   "prisma migrate deploy"
```

**Automatic migration on devcontainer start:** `prisma migrate deploy` runs as part of the container postStart command so teams always have an up-to-date schema.

---

## 5. UI & Components

**Stack:** Next.js 16 App Router + Tailwind CSS + shadcn/ui (Turbopack default bundler)

**Pre-installed shadcn/ui primitives:**
- Button, Card, Avatar, DropdownMenu, Separator

**Starter components:**
- `Navbar` — auth-aware: user avatar + name + sign-out dropdown when signed in; "Sign in" button when not
- `PageLayout` — consistent page wrapper with navbar
- `SignInCard` — centred card with "Sign in with Oidc" button (used on `/`)
- `Dashboard` — protected landing page with user greeting

**Conventions enforced via `CLAUDE.md`:**
1. Always use shadcn/ui primitives when building UI. Install the component via `npx shadcn add <component>` before using it. Never write custom markup for elements shadcn covers.
2. Before implementing any new feature with a UI element, consider whether it should be extracted as a reusable component in `src/components/`.

These rules apply whether teams use slash commands or ask Claude freeform.

---

## 6. Claude Code Integration

OpenSpec is the primary planning and change management workflow. Superpowers skills that overlap with OpenSpec (brainstorming, writing-plans, executing-plans) are intentionally excluded to avoid two competing planning workflows.

**`.claude/` includes:**
- OpenSpec workflow skills: `opsx:explore`, `opsx:propose`, `opsx:apply`, `opsx:archive`
- `commit-commands` — commit, push, and open PRs
- `create-nextjs-component` — component scaffolding with shadcn-first as a hard rule
- `superpowers:systematic-debugging` — structured debugging methodology

**`CLAUDE.md` (project-level)** enforces:
- shadcn-first UI development
- Component reuse consideration on every feature
- OpenSpec workflow for structured changes

---

## 7. Developer Onboarding

**Getting started (4 steps):**
1. Fork the Bitbucket repo
2. Open in VS Code / Coder workspace — devcontainer starts automatically
3. Copy `.env.example` → `.env.local`, fill in `OIDC_CLIENT_ID`, `OIDC_ISSUER`, `AUTH_SECRET`
4. App running at `localhost:3000` with auth and DB ready

**`README.md` covers:**
- Prerequisites (Docker, VS Code + Dev Containers extension)
- Getting started steps above
- Available npm scripts
- How to add a new route, Prisma model, and component
- How to use the Claude slash commands

---

## Non-Goals

- No example domain models — teams define their own data layer
- No CI/CD pipeline — out of scope for a hackathon template
- No multi-tenancy or team isolation at the app level
- No email/password auth — Oidc only
