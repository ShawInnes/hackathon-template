---
description: Auth.js v5 conventions and gotchas — triggers when working with authentication, sessions, OIDC, or the auth config
globs: ["src/lib/auth.ts", "src/types/next-auth.d.ts", "src/app/api/auth/**"]
---

# Auth.js v5

- **Session callback is required** to expose `user.id`: without it, `session.user.id` is always undefined.
- **TypeScript types**: `src/types/next-auth.d.ts` augments the session to include `user.id`.
- **`profile()` on custom OIDC providers is unreliable** in Auth.js v5 — do not rely on it. Profile data is fetched manually in the `signIn` callback instead.
- **Userinfo endpoint**: The `signIn` callback in `src/lib/auth.ts` manually calls the userinfo endpoint (discovered from `.well-known/openid-configuration`) using the `access_token` and writes the result directly to the database.
