---
description: Secret-handling rules — gitleaks runs pre-commit, no secrets in code, all credentials via env vars
---

# Secrets Handling

## Hard rules

- **Never hardcode** API keys, tokens, passwords, OIDC client secrets, or DB credentials. Use env vars only.
- **Never commit `.env`, `.env.local`, or any `*.local` file.** They are gitignored — if you see one tracked, that is a bug.
- **Validate env vars with Zod** at module load (`src/lib/env.ts`) — see `zod-schemas` rule.
- **No secrets in logs.** Do not `console.log(process.env.*)` for any sensitive var.
- **No secrets in error messages** that bubble to the client.

## Pre-commit scan

`gitleaks` runs on every commit via `simple-git-hooks` → `gitleaks protect --staged`. The default Gitleaks ruleset catches AWS, GCP, Stripe, GitHub, Slack tokens, JWTs, generic high-entropy strings, etc. Config in `.gitleaks.toml`.

If gitleaks is not installed (binary, not npm), the hook prints a warning and continues. Install once per machine: `brew install gitleaks`.

## What to do if gitleaks flags a real leak

1. **Do not amend or force-push** to hide it. The secret is already committed locally and may have been pushed.
2. Rotate the credential **first**, before anything else.
3. Then remove the secret from the working tree, commit the fix, and proceed.
4. If already pushed to a shared branch, follow the team's secret-rotation runbook — never silently rewrite history.

## Allowing false positives

Local-development DSNs (e.g. `postgresql://postgres:postgres@db:5432/...`) are allowlisted in `.gitleaks.toml`. Add narrow regex allowlists there if a known-safe pattern keeps tripping. Never disable gitleaks globally.

## Manual scan

```bash
npm run lint:secrets   # full-repo scan
```

Run before merging branches that touched config, env handling, or new integrations.
