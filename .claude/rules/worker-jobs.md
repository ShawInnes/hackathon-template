---
description: Graphile Worker background job harness — triggers when adding a background task, enqueuing work off the request cycle, or querying job/queue status
globs: ["worker/**", "src/lib/jobs/**"]
---

# Worker Jobs (Graphile Worker)

Background jobs run in a dedicated process (`worker/index.ts`), separate from
the Next.js server, via [Graphile Worker](https://worker.graphile.org/) — a
Postgres-backed job queue. Use this for work that shouldn't block a
request/response cycle: enqueue a row in Postgres and return immediately; the
worker process drains it.

## Adding a new task (3 steps, always in this order)

1. **`src/lib/jobs/tasks.ts`** — export the task name constant + payload
   interface. Shared between the enqueue side (Next.js) and the consume side
   (worker process), so keep it framework-agnostic.
2. **`src/lib/jobs/enqueue.ts`** — add an `enqueue<Task>` helper that calls
   `utils.addJob(TASK_NAME, payload)` via the shared `getWorkerUtils()`
   singleton. Call this helper from a server action or route handler.
3. **`worker/index.ts`** — register a handler for the task name in the
   `taskList` passed to `run()`.

Do not skip a step or implement the handler inline anywhere else — the
task/enqueue/handler triad is the only supported pattern.

## Running the worker

The worker is **not** started by `npm run dev` — it's a separate process:

```bash
npm run worker:dev   # tsx watch, restarts on file changes
npm run worker       # no watch, production
```

## Querying queue/job status

Graphile Worker manages its own `graphile_worker` Postgres schema
automatically (no Prisma migration involved). Its internal tables are
versioned/renamed across releases, but it maintains a **stable public
compatibility view — `graphile_worker.jobs`** — specifically so external
tooling can query job state without depending on internal table shape. Query
this view via `prisma.$queryRaw`, not the internal `_private_*` tables.

Useful columns: `id`, `queue_name`, `task_identifier`, `priority`, `run_at`,
`attempts`, `max_attempts`, `last_error`, `created_at`, `locked_at`,
`locked_by`.

Status bucketing (there is no `status` column — derive it):

| Bucket | Condition |
|---|---|
| Pending | `locked_at IS NULL AND attempts < max_attempts` |
| Running | `locked_at IS NOT NULL` |
| Permanently failed | `locked_at IS NULL AND attempts >= max_attempts` |

**Completed jobs are deleted, not archived.** Graphile Worker's
`complete_jobs()` function `DELETE`s a job row the moment it succeeds — there
is no persisted history of completed jobs anywhere in the schema. Any
status/dashboard UI can only ever show pending, running, and permanently
failed jobs, never a completion log. Zod-validate query results per the
`zod-schemas` rule — `$queryRaw` against a schema Prisma doesn't manage
returns `unknown` typing.

## See also

- `worker-jobs` skill (`.claude/skills/worker-jobs/SKILL.md`) — worked example
  including the status page pattern used in this app (`src/app/worker/`).
