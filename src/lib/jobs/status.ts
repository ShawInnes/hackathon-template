// Queue status queries for the worker status page. Reads the public,
// version-stable `graphile_worker.jobs` compatibility view — never the
// internal `_private_*` tables. See the `worker-jobs` rule for why.

import { z } from "zod"
import { prisma } from "@/lib/prisma"

const QueueStats = z.object({
  pending: z.number().int(),
  running: z.number().int(),
  failed: z.number().int(),
})

export type QueueStats = z.infer<typeof QueueStats>

export async function getQueueStats(): Promise<QueueStats> {
  const rows = await prisma.$queryRaw<unknown[]>`
    SELECT
      COUNT(*) FILTER (WHERE locked_at IS NULL AND attempts < max_attempts)::int AS pending,
      COUNT(*) FILTER (WHERE locked_at IS NOT NULL)::int AS running,
      COUNT(*) FILTER (WHERE locked_at IS NULL AND attempts >= max_attempts)::int AS failed
    FROM graphile_worker.jobs
  `
  return QueueStats.parse(rows[0])
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

export type JobStatus = "pending" | "running" | "failed"

export function jobStatus(job: Pick<JobRow, "lockedAt" | "attempts" | "maxAttempts">): JobStatus {
  if (job.lockedAt) return "running"
  if (job.attempts >= job.maxAttempts) return "failed"
  return "pending"
}

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
