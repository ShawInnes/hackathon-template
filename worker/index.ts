// Dedicated job worker. Runs as its own process (`npm run worker`) and drains
// the Postgres-backed Graphile Worker queue. Because it lives outside the
// request lifecycle, work continues even after the request that enqueued it
// has finished.
//
// Register a handler for each task exported from `src/lib/jobs/tasks.ts`
// below. Graphile Worker installs/migrates its own `graphile_worker` schema
// on first boot — no Prisma migration is involved.

import { run } from "graphile-worker"
import { env } from "@/lib/env"
import { configureLogging, workerLogger } from "@/lib/logger"
import { LOG_MESSAGE, type LogMessagePayload } from "@/lib/jobs/tasks"

async function main() {
  await configureLogging()

  const runner = await run({
    connectionString: env.DATABASE_URL,
    concurrency: 2,
    taskList: {
      [LOG_MESSAGE]: async (payload) => {
        const { message } = payload as LogMessagePayload
        workerLogger.info("logMessage: {message}", { message })
      },
    },
  })

  workerLogger.info("connected — waiting for jobs")
  await runner.promise
}

main().catch((err) => {
  workerLogger.fatal("fatal error {error}", {
    error: err instanceof Error ? err.message : String(err),
  })
  process.exit(1)
})
