## ADDED Requirements

### Requirement: Auth disabled via env var
When `NEXT_PUBLIC_AUTH_ENABLED` is not set to `"true"`, the application SHALL operate without OIDC authentication. The `AUTH_OIDC_ISSUER` and `AUTH_OIDC_ID` env vars SHALL NOT be required.

#### Scenario: App starts without OIDC env vars when auth disabled
- **WHEN** `NEXT_PUBLIC_AUTH_ENABLED` is absent or not `"true"`
- **THEN** the app starts and serves pages without error

#### Scenario: Synthetic session returned when auth disabled
- **WHEN** `auth()` is called server-side and `NEXT_PUBLIC_AUTH_ENABLED !== "true"`
- **THEN** it returns a session with `user.id = "dev"`, `user.name = "Dev User"`, `user.email = "dev@local"`

### Requirement: Auth API routes disabled when auth disabled
Auth.js route handlers (`/api/auth/*`) SHALL return HTTP 404 when `NEXT_PUBLIC_AUTH_ENABLED !== "true"`.

#### Scenario: Auth API returns 404
- **WHEN** a request hits `/api/auth/signin` and auth is disabled
- **THEN** the response status is 404

### Requirement: Proxy bypasses session check when auth disabled
The middleware proxy SHALL skip session-cookie enforcement for all protected paths when `NEXT_PUBLIC_AUTH_ENABLED !== "true"`.

#### Scenario: Protected path accessible without session cookie
- **WHEN** a request to `/dashboard` has no session cookie and auth is disabled
- **THEN** the request is not redirected to `/`

### Requirement: Navbar hides sign-out when auth disabled
The Navbar component SHALL NOT render the sign-out dropdown when `NEXT_PUBLIC_AUTH_ENABLED !== "true"`. It SHALL render the user's name as plain text instead.

#### Scenario: Sign-out hidden when auth disabled
- **WHEN** the Navbar renders with a user and auth is disabled
- **THEN** no sign-out button or dropdown is visible

#### Scenario: Sign-out visible when auth enabled
- **WHEN** the Navbar renders with a user and `NEXT_PUBLIC_AUTH_ENABLED === "true"`
- **THEN** the sign-out dropdown is rendered

### Requirement: Auth enabled by default
When `NEXT_PUBLIC_AUTH_ENABLED` is not set, the application SHALL behave as if auth is enabled (`true`). Disabling auth requires explicit opt-in.

#### Scenario: Missing env var defaults to auth enabled
- **WHEN** `NEXT_PUBLIC_AUTH_ENABLED` is not present in the environment
- **THEN** OIDC auth is active and `AUTH_OIDC_ISSUER` / `AUTH_OIDC_ID` are required
