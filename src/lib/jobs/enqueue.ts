// Enqueue side of the job engine. Call these from server actions or route
// handlers to hand work to the dedicated worker process (`worker/index.ts`)
// via Graphile Worker's Postgres-backed queue, and return immediately.
//
// A single WorkerUtils instance is reused across HMR reloads (mirrors the
// prisma singleton in `src/lib/prisma.ts`) so dev doesn't leak a connection
// pool per reload.

import { makeWorkerUtils, type WorkerUtils } from "graphile-worker"
import { env } from "@/lib/env"
import { LOG_MESSAGE, type LogMessagePayload } from "@/lib/jobs/tasks"

const globalForWorker = globalThis as unknown as {
  workerUtils?: Promise<WorkerUtils>
}

export function getWorkerUtils(): Promise<WorkerUtils> {
  if (!globalForWorker.workerUtils) {
    globalForWorker.workerUtils = makeWorkerUtils({
      connectionString: env.DATABASE_URL,
    })
  }
  return globalForWorker.workerUtils
}

/** Example task — enqueues a message for the worker to log. Replace with
 * your own `enqueue<Task>` helpers as you add tasks in `tasks.ts`. */
export async function enqueueLogMessage(payload: LogMessagePayload): Promise<void> {
  const utils = await getWorkerUtils()
  await utils.addJob(LOG_MESSAGE, payload)
}
