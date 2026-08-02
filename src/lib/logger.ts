import { configure, getConsoleSink, getLogger, jsonLinesFormatter } from "@logtape/logtape"
import { prettyFormatter } from "@logtape/pretty"
import { DEFAULT_REDACT_FIELDS, redactByField } from "@logtape/redaction"
import { env } from "@/lib/env"

export const logger = getLogger(["app"])
export const workerLogger = getLogger(["app", "worker"])

/**
 * Configures LogTape sinks/loggers. Called once per process — from
 * `src/instrumentation.ts` for the Next.js server, and from `worker/index.ts`
 * for the standalone Graphile Worker process — since each runs as its own
 * Node process and gets its own module registry.
 */
export async function configureLogging() {
  const isDev = env.NODE_ENV !== "production"

  await configure({
    sinks: {
      console: redactByField(
        getConsoleSink({ formatter: isDev ? prettyFormatter : jsonLinesFormatter }),
        [
          /authorization/i,
          /cookie/i,
          /access[_-]?token/i,
          /refresh[_-]?token/i,
          /id[_-]?token/i,
          ...DEFAULT_REDACT_FIELDS,
        ],
      ),
    },
    loggers: [
      {
        category: ["app"],
        lowestLevel: env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
        sinks: ["console"],
      },
      { category: "logtape", sinks: ["console"], lowestLevel: "error" },
    ],
  })
}
