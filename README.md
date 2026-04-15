# Hackday Template

A Next.js 16 hackathon starter with OIDC SSO auth, PostgreSQL, and Claude Code built in.

## What's included

- **Next.js 16** — App Router, TypeScript, Tailwind CSS, Turbopack
- **Auth.js v5** — OIDC SSO via PKCE (no client secret needed)
- **Prisma + PostgreSQL** — database with migrations
- **shadcn/ui** — Button, Card, Avatar, DropdownMenu, Separator pre-installed
- **Dev container** — everything runs in Docker, no local setup required
- **Claude Code skills** — OpenSpec workflow, component scaffolding, debugging

## Getting started

**Prerequisites:** Docker Desktop, VS Code with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

1. **Fork** this repository in Bitbucket
2. **Open** the repo in VS Code → when prompted, click "Reopen in Container"
3. **Copy** `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```
   | Variable | Where to get it |
   |----------|----------------|
   | `AUTH_OIDC_ID` | OIDC client ID — provided by hackathon organisers |
   | `AUTH_OIDC_ISSUER` | OIDC issuer URL — provided by hackathon organisers |
   | `AUTH_SECRET` | Run: `openssl rand -base64 32` |
   | `DATABASE_URL` | Pre-filled — uses the devcontainer Postgres |

4. **Run** the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) — you should see the sign-in page.

## Building your app

### Add a new page

Create `src/app/my-page/page.tsx`. To make it authenticated:

```typescript
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PageLayout } from "@/components/page-layout"

export default async function MyPage() {
  const session = await auth()
  if (!session?.user) redirect("/")

  return (
    <PageLayout user={session.user}>
      <h1>My Page</h1>
    </PageLayout>
  )
}
```

Then add `"/my-page"` to `PROTECTED_PATHS` in `src/proxy.ts`.

### Add a database model

Edit `prisma/schema.prisma` — add your model below the comment line, then:

```bash
npm run prisma:migrate   # creates and runs the migration
npm run prisma:studio    # opens a database browser at localhost:5555
```

### Add a UI component

```bash
# Install a shadcn primitive first
npx shadcn add <component-name>

# Or use the Claude Code skill to scaffold a custom component
# In Claude Code: /create-nextjs-component
```

### Plan a feature with OpenSpec

```
/opsx:propose my-feature-name    # creates proposal, design, tasks
/opsx:apply my-feature-name      # implements the tasks
/opsx:archive my-feature-name    # archives when done
```

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Production build |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run prisma:migrate` | Create a new migration |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:deploy` | Apply migrations (used in devcontainer start) |
