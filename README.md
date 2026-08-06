# Hackathon Template

A Next.js 16 hackathon starter with OIDC SSO auth, PostgreSQL, and Claude Code built in.

## What's included

- **Next.js 16** — App Router, TypeScript, Turbopack
- **Auth.js v5** — OIDC SSO via PKCE (no client secret needed)
- **Prisma + PostgreSQL** — database with migrations, auto-provisioned locally via Docker Compose
- **Astryx design system** — `@astryxdesign/core` components (Button, Card, Avatar, DropdownMenu, AppShell, ...), with Tailwind CSS as a token-backed styling escape hatch
- **LogTape** — structured logging (`src/lib/logger.ts`), with request logging in `src/proxy.ts` and global error/exception capture via `src/instrumentation.ts`'s `onRequestError` hook
- **Graphile Worker** — Postgres-backed background job queue (`worker/`), for work that shouldn't block a request/response cycle
- **Claude Code skills** — component scaffolding, debugging

## Getting started

**Prerequisites:** Node.js 24, Docker (for the local Postgres container — skip if you already have a Postgres instance to point at)

1. **Fork** this repository in Bitbucket
2. **Install** dependencies:
   ```bash
   npm install
   ```
3. **Copy** `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   | Variable           | Where to get it                                    |
   | ------------------ | -------------------------------------------------- |
   | `AUTH_ENABLED`     | `"true"` to require OIDC sign-in, `"false"` to skip auth entirely |
   | `AUTH_OIDC_ID`     | OIDC client ID — provided by hackathon organisers  |
   | `AUTH_OIDC_ISSUER` | OIDC issuer URL — provided by hackathon organisers |
   | `AUTH_SECRET`      | Run: `openssl rand -base64 32`                     |
   | `DATABASE_URL`     | Optional — leave unset and `npm run dev` provisions a local Postgres via Docker Compose automatically. Set it to point at an existing Postgres instance instead |
   | `LOG_LEVEL`        | Optional — one of `trace`, `debug`, `info`, `warning`, `error`, `fatal`. Defaults to `debug` in development, `info` in production |
   | `ENABLE_WORKER`    | Optional — `"true"` to expose the Worker Status page and avatar menu item. Defaults to disabled |

4. **Run** the dev server:
   ```bash
   npm run dev
   ```
   The `predev` script (`scripts/ensure-db.sh`) finds or starts a local Postgres (Docker Compose, then a bare local install, then your configured `DATABASE_URL`) and applies pending migrations before the server starts. Open [http://localhost:3000](http://localhost:3000) — you should see the landing page.

## Building your app

### Add a new page

Create `src/app/my-page/page.tsx`. To make it authenticated:

```typescript
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PageLayout } from "@/components/page-layout"

export default async function MyPage() {
  const session = await auth()
  if (!session?.user) redirect("/signin")

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
# Discover the closest Astryx primitive first
npx astryx build "<idea>"
npx astryx component <component-name>

# Or use the Claude Code skill to scaffold a custom component
# In Claude Code: /create-nextjs-component
```

### Add a background job

Background jobs run in a separate process (`worker/index.ts`) via [Graphile Worker](https://worker.graphile.org/), a Postgres-backed job queue. Use this for work that shouldn't block a request/response cycle — it enqueues a row in Postgres and returns immediately; the worker process picks it up.

Graphile Worker manages its own `graphile_worker` schema in Postgres automatically — no Prisma migration needed.

1. **Define** the task name and payload type in `src/lib/jobs/tasks.ts`.
2. **Add an enqueue helper** in `src/lib/jobs/enqueue.ts` that calls `utils.addJob(TASK_NAME, payload)`.
3. **Register a handler** for the task name in `worker/index.ts`'s `taskList`.

Call the enqueue helper from a server action or route handler:

```typescript
import { enqueueLogMessage } from "@/lib/jobs/enqueue"

await enqueueLogMessage({ message: "hello from a server action" })
```

Run the worker in a separate terminal (it is not started by `npm run dev`):

```bash
npm run worker:dev   # restarts on file changes
npm run worker       # no watch, for production
```

Set `ENABLE_WORKER="true"` (see the env var table above) to expose **Worker Status** in the avatar menu and at `/worker` — it shows live queue counts, lets you enqueue a test job, and lists recent jobs. Disabled by default; the route 404s and the menu item is hidden when unset.

The production Docker image (see [Deployment](#deployment)) ships the full app — including `worker/` and the full `node_modules` tree — so the same image runs either role: `npm run start` for the web server, or `npm run worker` for the background worker, selected via the container command.

## npm scripts

| Script                   | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `npm run dev`            | Start dev server at localhost:3000            |
| `npm run build`          | Production build                              |
| `npm run worker`         | Run the background job worker (Graphile Worker) |
| `npm run worker:dev`     | Run the worker, restarting on file changes    |
| `npm run test`           | Run tests                                     |
| `npm run test:watch`     | Run tests in watch mode                       |
| `npm run prisma:migrate` | Create a new migration                        |
| `npm run prisma:studio`  | Open Prisma Studio                            |
| `npm run prisma:deploy`  | Apply migrations (run automatically via `predev`) |

## Deployment

The app ships as a Helm chart (`deploy/chart/`) with a bundled CloudNativePG Postgres cluster, deployed via a TeamCity Kotlin DSL pipeline (`.teamcity/`). Staging and production are fully isolated — separate namespaces, releases, and database instances.

**App name is derived, not configured.** `deploy/scripts/lib.sh` derives the app name from the git remote (repo basename, with a legacy `t1-` prefix stripped) and every script/build type threads it through — image repository, Helm release name, namespace, and the `appName` chart value. Forking this template requires no edit for the app name itself; only the items in [Configuration required before first deploy](#configuration-required-before-first-deploy) below.

### Chart layout

```
deploy/
  chart/
    Chart.yaml
    values.yaml               # defaults: 1 replica, Postgres enabled
    values-staging.yaml       # staging overrides
    values-production.yaml    # production overrides (2 replicas, larger Postgres)
    templates/                # Deployment, Service, Ingress, ConfigMap, Secret, CNPG Cluster
  ecr.yaml                     # Crossplane ECR Repository (applied once, outside the chart)
  scripts/
    build-and-push.sh          # multi-arch buildx build + push (:sha, :latest, :staging)
    deploy.sh                  # aws eks update-kubeconfig + helm upgrade --install
    promote.sh                 # retags :staging → :<semver> with buildx imagetools (no rebuild)
```

Postgres is provisioned in-cluster via a CNPG `Cluster` resource (toggle with `postgres.enabled` in values) and its connection string is injected as `DATABASE_URL` automatically. Set `postgres.enabled: false` and configure `externalDatabase` in values to point at an external Postgres instead.

**The worker is not yet deployed by the Helm chart.** The built image supports both roles (see [Add a background job](#add-a-background-job)), but `deploy/chart/templates/` currently only defines a `Deployment` for the web role. To run the worker in a deployed environment, add a second `Deployment` (or `Job`) template that uses the same image with its command overridden to `npm run worker`.

### Deploying manually

```bash
aws eks update-kubeconfig --name <cluster> --region ap-southeast-2

# Staging
helm upgrade --install <app>-staging deploy/chart \
  -f deploy/chart/values.yaml -f deploy/chart/values-staging.yaml \
  --namespace app-<app>-staging --create-namespace \
  --set appName=<app> --set image.repository=<ecr-repo> --set image.tag=staging \
  --set-string secret.authSecret=<auth-secret> --wait

# Production (image.tag is always an explicit semver — never "latest")
helm upgrade --install <app> deploy/chart \
  -f deploy/chart/values.yaml -f deploy/chart/values-production.yaml \
  --namespace app-<app> --create-namespace \
  --set appName=<app> --set image.repository=<ecr-repo> --set image.tag=1.2.3 \
  --set-string secret.authSecret=<auth-secret> --wait
```

Prefer the scripts over hand-rolled commands where possible — `deploy/scripts/deploy.sh <env> <image-tag> <cluster> <region> <ecr-registry-base>` derives `<app>` and all the names above for you.

### TeamCity pipeline

| Build type          | Trigger                              | What it does |
| -------------------- | ------------------------------------- | ------------ |
| `BuildAndPublish`    | Push to `main`                        | `docker buildx build` (amd64+arm64) → push to ECR tagged `:<sha>`, `:latest`, `:staging` |
| `DeployStaging`      | `BuildAndPublish` succeeds on `main`  | `helm upgrade --install` into the staging namespace, pinned to `:staging` |
| `DeployProduction`   | Push of a `vX.Y.Z` git tag            | Retags `:staging` → `:X.Y.Z` (`docker buildx imagetools create`, no rebuild) → `helm upgrade --install` into production with `image.tag=X.Y.Z` |

**Tagging strategy**: every push to `main` moves `:latest` and `:staging` to the new image and redeploys staging. Promoting to production never rebuilds — it retags the exact image bits already validated in staging, so a semver tag (`git tag v1.2.3 && git push --tags`) is what ships to production.

### Configuration required before first deploy

| Where | What to set |
| ----- | ----------- |
| TeamCity Context Parameters (Administration > project > Versioned Settings > Context Parameters) | `EcrAccountNumber`, `EcrConnectionName`, `AwsConnectionId`, `EksClusterName` — read by `.teamcity/Variables.kt` via `DslContext.getParameter(...)`. Nothing account- or cluster-specific is ever committed to the repo |
| `deploy/chart/values-staging.yaml` / `values-production.yaml` | `ingress.host` — the fully-qualified hostname for each environment |
| TeamCity project params | `staging.authSecret` / `production.authSecret` (password params, blank by default so a redeploy doesn't clobber the secret already in the cluster) |
| ECR | Apply `deploy/ecr.yaml` (Crossplane `Repository`) once per environment before the first `BuildAndPublish` run |
| Git remote (`origin`) | Must be configured on the build agent (TeamCity's default checkout) — the app name is derived from it |

## Local development

Local Postgres runs via `docker-compose.yml`, started automatically by the `predev` script (`scripts/ensure-db.sh`) — no manual `docker compose up` needed unless you want to manage it yourself.

### Ports

| Port | Service                                 |
| ---- | --------------------------------------- |
| 3000 | Next.js dev server                      |
| 5432 | PostgreSQL (Docker Compose)             |
| 5555 | Prisma Studio (`npm run prisma:studio`) |

The Postgres data volume (`postgres_data`) persists across container restarts — your database is not wiped between runs.

### Private CA certificates

If your OIDC provider uses a certificate signed by a private CA, Node.js will reject the TLS connection even if your browser trusts it (they use separate CA stores). Add this to `.env` to disable TLS verification for local development:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0
```

Do not set this in production.
