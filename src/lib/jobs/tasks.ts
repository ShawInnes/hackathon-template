// Job task identities + payload contracts, shared between the enqueue side
// (server actions / route handlers, running inside Next.js) and the consume
// side (`worker/index.ts`, a standalone Node process). Kept framework-agnostic
// so both can import it.
//
// Add a new task by: (1) exporting its name + payload type here, (2) adding
// an `enqueue<Task>` helper in `src/lib/jobs/enqueue.ts`, (3) registering a
// handler for it in `worker/index.ts`.

export const LOG_MESSAGE = "logMessage"

export interface LogMessagePayload {
  message: string
}
