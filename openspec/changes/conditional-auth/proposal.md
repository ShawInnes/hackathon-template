## Why

OIDC auth is always enabled, requiring `AUTH_OIDC_ISSUER` and `AUTH_OIDC_ID` to be set. Local dev and hackathon forks without an OIDC provider configured can't run the app at all. Making auth conditional via `NEXT_PUBLIC_AUTH_ENABLED` unblocks development without an IdP.

## What Changes

- New env var `NEXT_PUBLIC_AUTH_ENABLED` controls whether OIDC auth is active
- When `false`: `auth()` returns a synthetic dev session, auth API routes return 404, proxy skips cookie check, navbar hides sign-out
- When `true` (default): behavior unchanged
- `AUTH_OIDC_ISSUER` / `AUTH_OIDC_ID` no longer required when auth disabled

## Non-goals

- Multiple auth providers
- Role-based access control
- Per-route granularity beyond existing `PROTECTED_PATHS`

## Capabilities

### New Capabilities

- `conditional-auth`: Toggle OIDC authentication on/off via `NEXT_PUBLIC_AUTH_ENABLED` env var. When disabled, app runs with a synthetic dev session and no OIDC dependencies required.

### Modified Capabilities

_(none — no existing spec-level requirements changing)_

## Impact

- `src/lib/auth.ts` — conditional NextAuth instantiation
- `src/proxy.ts` — skip session cookie check when auth disabled
- `src/components/navbar.tsx` — hide sign-out dropdown when auth disabled
- `.env.example` — add `NEXT_PUBLIC_AUTH_ENABLED=true`
