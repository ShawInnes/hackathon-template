---
name: worker-jobs
description: Add a background job task, enqueue work from a server action, or build a queue status/inspection UI on top of Graphile Worker. Use when the task involves deferred/background processing, or querying pending/running/failed job counts.
---

# Worker Jobs Skill

Goal: extend the Graphile Worker harness (`worker/`, `src/lib/jobs/`) correctly
— adding tasks, enqueuing them, and reading queue status — without
reimplementing any of it ad hoc.

The full pattern and status-query SQL are documented in the always-active
`worker-jobs` rule (`.claude/rules/worker-jobs.md`) — read that first. This
skill is the worked example.

## Add a new background task

```ts
// src/lib/jobs/tasks.ts
export const SEND_WELCOME_EMAIL = "sendWelcomeEmail"

export interface SendWelcomeEmailPayload {
  userId: string
}
```

```ts
// src/lib/jobs/enqueue.ts
import { SEND_WELCOME_EMAIL, type SendWelcomeEmailPayload } from "@/lib/jobs/tasks"

export async function enqueueSendWelcomeEmail(payload: SendWelcomeEmailPayload): Promise<void> {
  const utils = await getWorkerUtils()
  await utils.addJob(SEND_WELCOME_EMAIL, payload)
}
```

```ts
// worker/index.ts — inside the taskList passed to run()
[SEND_WELCOME_EMAIL]: async (payload) => {
  const { userId } = payload as SendWelcomeEmailPayload
  // ... send the email
},
```

Call the enqueue helper from a server action or route handler — never from a
client component (it touches `DATABASE_URL` directly).

## Query queue status for a UI

Query the public `graphile_worker.jobs` compatibility view directly — do not
touch `graphile_worker._private_jobs` or any other internal table, those are
not a stable interface across Graphile Worker versions.

```ts
// src/lib/jobs/status.ts
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const QueueStats = z.object({
  pending: z.number().int(),
  running: z.number().int(),
  failed: z.number().int(),
})
export type QueueStats = z.infer<typeof QueueStats>

export async function getQueueStats(): Promise<QueueStats> {
  const [row] = await prisma.$queryRaw<unknown[]>`
    SELECT
      COUNT(*) FILTER (WHERE locked_at IS NULL AND attempts < max_attempts)::int AS pending,
      COUNT(*) FILTER (WHERE locked_at IS NOT NULL)::int AS running,
      COUNT(*) FILTER (WHERE locked_at IS NULL AND attempts >= max_attempts)::int AS failed
    FROM graphile_worker.jobs
  `
  return QueueStats.parse(row)
}

const JobRow = z.object({
  id: z.string(),
  taskIdentifier: z.string(),
  queueName: z.string().nullable(),
  attempts: z.number().int(),
  maxAttempts: z.number().int(),
  runAt: z.date(),
  lockedAt: z.date().nullable(),
  lastError: z.string().nullable(),
})
export type JobRow = z.infer<typeof JobRow>

export async function getRecentJobs(limit = 25): Promise<JobRow[]> {
  const rows = await prisma.$queryRaw<unknown[]>`
    SELECT
      id::text AS "id",
      task_identifier AS "taskIdentifier",
      queue_name AS "queueName",
      attempts AS "attempts",
      max_attempts AS "maxAttempts",
      run_at AS "runAt",
      locked_at AS "lockedAt",
      last_error AS "lastError"
    FROM graphile_worker.jobs
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return z.array(JobRow).parse(rows)
}
```

Cast `id` to `::text` in SQL — Postgres `bigint` doesn't round-trip through
`$queryRaw` as a JS `number` safely.

## Rendering status in a server component

No `status` column exists — derive a label from `lockedAt`/`attempts`/
`maxAttempts` per the bucketing rule, as plain text. Don't reach for
`renderCell` + a client-component Table wrapper just to colour-code a status
column on a low-traffic internal page — plain string columns keep the whole
page a server component (see `src/app/worker/page.tsx` for the reference
implementation in this repo).

## Anti-patterns

- Querying `graphile_worker._private_jobs` or any `_private_*` table directly
  — use the public `graphile_worker.jobs` view.
- Expecting a list of completed jobs — Graphile Worker deletes a job row the
  moment it completes successfully. There is no persisted history.
- Skipping the Zod parse on `$queryRaw` results — Prisma has no schema
  knowledge of `graphile_worker.jobs`, so results are `unknown`.
- Implementing a task's handler logic anywhere other than `worker/index.ts`'s
  `taskList`.

## Verify

- [ ] Task name + payload type live only in `src/lib/jobs/tasks.ts`.
- [ ] Enqueue helper added in `src/lib/jobs/enqueue.ts`, called from a server
      action/route handler (never a client component).
- [ ] Handler registered in `worker/index.ts`'s `taskList`.
- [ ] Any status query goes through `graphile_worker.jobs` (the public view),
      Zod-validated.
- [ ] `npm run worker:dev` picks up the new handler without errors.
