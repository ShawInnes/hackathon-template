import { configureSync, getConsoleSink } from "@logtape/logtape"

configureSync({
  sinks: { console: getConsoleSink() },
  loggers: [
    { category: ["app"], lowestLevel: "info", sinks: ["console"] },
    { category: "logtape", sinks: ["console"], lowestLevel: "error" },
  ],
})
