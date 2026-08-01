import { configure, getConsoleSink, getLogger, jsonLinesFormatter } from "@logtape/logtape"
import { prettyFormatter } from "@logtape/pretty"
import { DEFAULT_REDACT_FIELDS, redactByField } from "@logtape/redaction"
import type { Instrumentation } from "next"
import { env } from "@/lib/env"

const isDev = env.NODE_ENV !== "production"

export async function register() {
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

export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  getLogger(["app", "request"]).error("Unhandled request error: {message}", {
    message: err instanceof Error ? err.message : String(err),
    digest: (err as { digest?: string })?.digest,
    path: request.path,
    method: request.method,
    routeType: context.routeType,
  })
}
