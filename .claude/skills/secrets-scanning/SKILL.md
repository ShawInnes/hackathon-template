---
name: secrets-scanning
description: Run, configure, or recover from gitleaks secret scans. Use when adding new env vars, adjusting allowlists, recovering from a flagged secret, or installing gitleaks on a new machine.
---

# Secrets Scanning Skill

Goal: catch credentials before they hit a remote, and respond correctly when one slips through.

## Install gitleaks (first time per machine)

`gitleaks` is a Go binary, not an npm package. Pre-commit hook prints a warning and continues if it's missing.

```bash
brew install gitleaks                 # macOS
# or
docker pull zricethezav/gitleaks      # CI / no-brew
```

Verify: `gitleaks version`.

## Day-to-day commands

```bash
npm run lint:secrets                  # full repo scan
gitleaks protect --staged --redact    # staged-only (what pre-commit runs)
```

The pre-commit hook runs the second command automatically.

## When gitleaks flags a real secret

**Order matters — do not skip steps.**

1. **Rotate the credential first.** Revoke the leaked token / key at the provider before doing anything in git.
2. Remove the secret from the working tree (replace with `process.env.X` reference + add to `.env.local`).
3. Commit the cleaned file.
4. **If the secret was already pushed** to a shared remote: follow the team's rotation runbook. Do NOT silently force-push history rewrites — other clones still have the secret.
5. If only local: `git reset` the bad commit and re-commit. Still rotate the credential — assume any local secret has leaked.

## When gitleaks flags a false positive

Edit `.gitleaks.toml`:

```toml
[allowlist]
regexes = [
  '''YOUR_SAFE_REGEX_HERE''',
]
paths = [
  '''path/to/safe/file\.ext''',
]
```

Keep allowlists narrow — never `regexes = ['''.*''']`. Document why each entry is safe.

## Adding a new secret-bearing env var

1. Add to `.env.example` with a placeholder (`SECRET_KEY=replace-me`).
2. Add to the Zod env schema (`src/lib/env.ts` — see `zod-schemas` skill).
3. Add to deployment env (Vercel / docker / wherever).
4. Never hardcode for "local testing" — use `.env.local`.

## Anti-patterns

- `git commit --no-verify` to bypass a flagged secret.
- Adding the secret value to `.gitleaks.toml` allowlist as a literal string — that's still committing the secret.
- Logging `process.env.X` for a sensitive var "to debug".
- Returning credentials in API error responses.

## Verify

- [ ] `gitleaks version` works on dev machine + CI.
- [ ] `npm run lint:secrets` exits 0 on a clean tree.
- [ ] `.env.example` lists every required env var with a placeholder.
- [ ] `src/lib/env.ts` Zod-validates `process.env` at load.
- [ ] `.env*` is gitignored.
