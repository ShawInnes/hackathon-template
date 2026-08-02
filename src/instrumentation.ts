import type { Instrumentation } from "next"
import { getLogger } from "@logtape/logtape"
import { configureLogging } from "@/lib/logger"

export async function register() {
  await configureLogging()
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
