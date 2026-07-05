import type { NextConfig } from "next"

// Validate environment variables at startup — fails `next dev` / `next build`
// immediately on a missing/invalid required var instead of at request time.
import "./src/lib/env"

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",")
    : [],
}

export default nextConfig
