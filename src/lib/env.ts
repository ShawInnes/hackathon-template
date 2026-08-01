import { z } from "zod"

/**
 * Boot-time environment validation.
 *
 * Parsed once at module load. Imported for its side effect in `next.config.ts`
 * so `next dev` / `next build` fail immediately with a clear message when a
 * required variable is missing — rather than surfacing as a 500 deep in a
 * request. Add project-specific required vars (e.g. OPENAI_API_KEY,
 * OPENAI_BASE_URL for AI features) to the schema below as you introduce them.
 *
 * Server-side only. Do NOT import this from client components or the edge
 * runtime (`src/proxy.ts`) — it pulls Zod into whichever bundle imports it and
 * reads server-only vars.
 */
const EnvSchema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    AUTH_ENABLED: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
    AUTH_OIDC_ID: z.string().optional(),
    AUTH_OIDC_ISSUER: z.url().optional(),
    LOG_LEVEL: z.enum(["trace", "debug", "info", "warning", "error", "fatal"]).optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  })
  .refine((e) => !e.AUTH_ENABLED || Boolean(e.AUTH_OIDC_ID), {
    path: ["AUTH_OIDC_ID"],
    message: "AUTH_OIDC_ID is required when AUTH_ENABLED=true",
  })
  .refine((e) => !e.AUTH_ENABLED || Boolean(e.AUTH_OIDC_ISSUER), {
    path: ["AUTH_OIDC_ISSUER"],
    message: "AUTH_OIDC_ISSUER is required when AUTH_ENABLED=true",
  })

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("❌ Invalid environment variables:\n" + z.prettifyError(parsed.error))
  throw new Error("Invalid environment variables")
}

export const env = parsed.data
