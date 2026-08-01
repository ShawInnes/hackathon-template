import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const startedAt = Date.now()
  let dbOk = false
  let dbLatencyMs: number | null = null
  let dbError: string | null = null

  try {
    const t = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbLatencyMs = Date.now() - t
    dbOk = true
  } catch (e) {
    dbError = e instanceof Error ? e.message : "unknown"
    logger.error("db ping failed: {message}", { message: dbError })
  }

  const ok = dbOk
  const body = {
    status: ok ? "ok" : "degraded",
    uptimeSec: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    checks: {
      db: { ok: dbOk, latencyMs: dbLatencyMs, error: dbError },
    },
    durationMs: Date.now() - startedAt,
  }

  return NextResponse.json(body, { status: ok ? 200 : 503 })
}
