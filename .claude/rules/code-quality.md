---
description: Code quality tooling — Prettier, ESLint, lint-staged, simple-git-hooks, ts-reset. Always-active so every change runs through the same gate.
---

# Code Quality

The project enforces formatting, linting, and type safety through a single pre-commit pipeline. Do not bypass it.

## Tooling stack

| Tool | Role |
|------|------|
| Prettier | Sole formatter — config in `.prettierrc.json`, ignore in `.prettierignore` |
| `prettier-plugin-tailwindcss` | Sorts Tailwind class names automatically |
| ESLint (`eslint-config-next` + `eslint-config-prettier`) | Lint rules; Prettier-conflict rules disabled |
| `@total-typescript/ts-reset` | Tightens stdlib types — imported in `src/ts-reset.d.ts` |
| `lint-staged` | Runs ESLint + Prettier on staged files only |
| `simple-git-hooks` | Wires `pre-commit` to lint-staged + gitleaks |
| `gitleaks` | Pre-commit secret scan (binary — `brew install gitleaks`) |

## Scripts

- `npm run format` — write Prettier across the repo.
- `npm run format:check` — verify formatting in CI.
- `npm run lint` — ESLint.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run lint:prisma` — prisma-lint on the schema.
- `npm run lint:secrets` — full repo gitleaks scan.

## Rules

- **Never run `--no-verify` on commits** — pre-commit must pass. If a hook fails, fix the cause; never bypass.
- **Never disable an ESLint rule inline** without a one-line comment explaining why. Prefer fixing the code.
- **Never edit `src/generated/`** — it's regenerated.
- **Do not commit real env files** (`.env`, `.env.local`, `*.local`) — gitleaks blocks most patterns; treat any secret-like value as a hard error. **`.env.example` is the exception**: it is tracked and must be committed. Edit it freely, but only with placeholder values — never a real secret. Keep it in sync with `src/lib/env.ts` (see `secrets-handling`).
- **`as any` and `@ts-ignore`** — both forbidden. Use `@ts-expect-error` with a comment if a genuine type-system gap exists.
- **`ts-reset` is loaded once** in `src/ts-reset.d.ts`. Do not import it elsewhere; it's global.

## ts-reset behaviour to be aware of

After `ts-reset` is loaded, these stdlib calls return safer types:

| Call | Before | After |
|------|--------|-------|
| `JSON.parse(...)` | `any` | `unknown` — must Zod-parse |
| `await res.json()` | `any` | `unknown` — must Zod-parse |
| `arr.filter(Boolean)` | `T[]` | `NonNullable<T>[]` |
| `Array.isArray(x)` on `unknown` | narrows to `any[]` | narrows to `unknown[]` |

This pairs naturally with the `zod-schemas` rule — every boundary now requires explicit parsing.

## Pre-commit pipeline

`simple-git-hooks` runs on every commit:

1. `lint-staged` → ESLint `--fix` + Prettier `--write` on staged files.
2. `prisma-lint` if `prisma/schema.prisma` is staged.
3. `gitleaks protect --staged` (skipped with a warning if the binary isn't installed).

If any step fails, the commit is aborted. Fix the issue and re-stage.
