// Simple healthcheck for Docker container
// eslint-disable-next-line @typescript-eslint/no-require-imports
const http = require("http")

const options = {
  host: "127.0.0.1",
  port: process.env.PORT || 3000,
  path: process.env.HEALTHCHECK_PATH || "/",
  timeout: 2000,
}

const request = http.request(options, (res) => {
  console.log(`Healthcheck status: ${res.statusCode}`)
  const maxStatus = process.env.HEALTHCHECK_PATH ? 300 : 500
  if (res.statusCode >= 200 && res.statusCode < maxStatus) {
    process.exit(0)
  } else {
    process.exit(1)
  }
})

request.on("error", (err) => {
  console.error("Healthcheck failed:", err.message)
  process.exit(1)
})

request.on("timeout", () => {
  console.error("Healthcheck timeout")
  request.destroy()
  process.exit(1)
})

request.end()
