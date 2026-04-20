## Context

Auth.js v5 is always initialised at module load time in `src/lib/auth.ts`. This means `AUTH_OIDC_ISSUER` and `AUTH_OIDC_ID` must be present even for local dev without an IdP. The proxy middleware always enforces session-cookie checks. The navbar always shows a sign-out dropdown for authenticated users.

## Goals / Non-Goals

**Goals:**
- Single env var (`NEXT_PUBLIC_AUTH_ENABLED`) disables OIDC entirely
- When disabled: app fully functional with a synthetic dev session, no IdP required
- Navbar hides sign-out control when auth disabled
- No behaviour change when `NEXT_PUBLIC_AUTH_ENABLED=true`

**Non-Goals:**
- Alternative auth providers
- Per-route auth toggling
- Production use with auth disabled

## Decisions

### Use `NEXT_PUBLIC_AUTH_ENABLED` (single var, not `AUTH_ENABLED`)

**Decision**: Use `NEXT_PUBLIC_AUTH_ENABLED` everywhere.

**Rationale**: The navbar is a client component — it can only read `NEXT_PUBLIC_*` vars. Using one var avoids having `AUTH_ENABLED` (server) and `NEXT_PUBLIC_AUTH_ENABLED` (client) that must be kept in sync. Server code can read `NEXT_PUBLIC_*` vars fine.

**Alternative considered**: `AUTH_ENABLED` for server + `NEXT_PUBLIC_AUTH_ENABLED` for client. Rejected — two vars, easy to desync.

### Conditional NextAuth instantiation in `src/lib/auth.ts`

**Decision**: Guard `NextAuth({...})` behind `if (AUTH_ENABLED)`. Export mock `auth`, `handlers`, `signIn`, `signOut` when disabled.

```
AUTH_ENABLED=true             AUTH_ENABLED=false
─────────────────             ──────────────────
real NextAuth()               auth()   → synthetic session
auth() → DB session           handlers → 404 responses
signIn/signOut → OIDC flow    signIn/signOut → async no-ops
```

**Rationale**: Keeps all conditional logic in one file. Pages, routes, and components import from `@/lib/auth` unchanged.

**Synthetic session shape**:
```ts
{ user: { id: "dev", name: "Dev User", email: "dev@local" }, expires: "2099-01-01T00:00:00.000Z" }
```

**Alternative considered**: Runtime check in every page/component. Rejected — scattered, error-prone.

### Proxy skips cookie check when auth disabled

**Decision**: Early return in `proxy()` when `NEXT_PUBLIC_AUTH_ENABLED !== "true"`.

**Rationale**: Middleware runs on edge — must be self-contained. The cookie check is optimistic-UX only (full validation happens in pages via `auth()`). Skipping it entirely when auth is disabled is correct.

### Navbar hides sign-out via env var read

**Decision**: Navbar reads `process.env.NEXT_PUBLIC_AUTH_ENABLED` directly. When not `"true"`, renders plain user name text instead of the sign-out dropdown.

**Rationale**: No prop drilling required. `NEXT_PUBLIC_*` vars are inlined at build time and available in client components.

## Risks / Trade-offs

- **Synthetic session persists across refreshes** — no cookie, no DB row. Acceptable for local dev; not a production concern since `AUTH_ENABLED=false` is dev-only.
- **Sign-out still wired in navbar** when auth enabled — no change to existing behaviour.
- **`NEXT_PUBLIC_AUTH_ENABLED` is build-time** — changing it requires a rebuild. Documented in `.env.example`.

## Migration Plan

1. Add `NEXT_PUBLIC_AUTH_ENABLED=true` to `.env.example`
2. Existing deployments with no `NEXT_PUBLIC_AUTH_ENABLED` set: `!== "true"` would disable auth — **default must be enabled**. Code checks `=== "true"` for auth-on, not `!== "false"` for auth-off. Requires opt-in to disable.
3. No DB migration needed.
