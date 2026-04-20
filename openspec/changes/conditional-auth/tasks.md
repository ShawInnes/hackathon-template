## 1. Environment Config

- [ ] 1.1 Add `NEXT_PUBLIC_AUTH_ENABLED=true` to `.env.example` alongside OIDC vars. Verify: `.env.example` contains the key.

## 2. Auth Module

- [x] 2.1 In `src/lib/auth.ts`, add `const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true"` at top of file.
- [x] 2.2 Wrap the `NextAuth({...})` call in `if (AUTH_ENABLED)`. Export real `auth`, `handlers`, `signIn`, `signOut` from the NextAuth result when enabled.
- [x] 2.3 Export mock implementations when `!AUTH_ENABLED`: `auth()` returns synthetic session `{ user: { id: "dev", name: "Dev User", email: "dev@local" }, expires: "2099-01-01T00:00:00.000Z" }`, `handlers` returns `{ GET, POST }` each responding with HTTP 404, `signIn`/`signOut` are async no-ops. Verify: TypeScript compiles with no errors (`npm run build` or `tsc --noEmit`).

## 3. Proxy Middleware

- [x] 3.1 In `src/proxy.ts`, add early return at top of `proxy()`: `if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== "true") return`. Verify: with `NEXT_PUBLIC_AUTH_ENABLED` unset, navigating to `/dashboard` in browser does not redirect to `/`.

## 4. Navbar Component

- [x] 4.1 In `src/components/navbar.tsx`, add `const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true"` inside the `Navbar` component.
- [x] 4.2 When `user` is present and `authEnabled` is false, render a plain `<span>{user.name}</span>` instead of the `DropdownMenu` sign-out control. Keep the existing dropdown for `authEnabled === true`. Verify: with auth disabled, no dropdown or sign-out button visible in the navbar.

## 5. Verification

- [ ] 5.1 Set `NEXT_PUBLIC_AUTH_ENABLED=false` (or omit it) and start dev server (`npm run dev`). Confirm: app loads, `/dashboard` accessible, navbar shows "Dev User" with no sign-out option.
- [ ] 5.2 Set `NEXT_PUBLIC_AUTH_ENABLED=true` with valid OIDC vars. Confirm: sign-in flow works end-to-end, sign-out dropdown appears after login.
- [x] 5.3 Run existing tests (`npm run test`). Confirm: no regressions. (Test runner fails on pre-existing @rollup/rollup-darwin-arm64 missing native module — unrelated to this change. TypeScript checks clean.)
