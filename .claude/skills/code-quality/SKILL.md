---
name: code-quality
description: Set up or troubleshoot the project's formatting + linting + pre-commit pipeline (Prettier, ESLint, lint-staged, simple-git-hooks, ts-reset, prisma-lint). Use when adding new file types, fixing CI lint failures, or extending the pre-commit checks.
---

# Code Quality Skill

Goal: keep the formatting + lint pipeline working without anyone needing to read each tool's docs.

## When to invoke

- A new file type isn't being formatted by Prettier.
- ESLint or Prettier reports unexpected errors after a config change.
- The pre-commit hook is firing the wrong tool, or not firing at all.
- You want to add a new check (e.g. `tsc --noEmit`) to pre-commit.
- A teammate's machine isn't picking up the hooks.

## Project layout

| File | Purpose |
|------|---------|
| `.prettierrc.json` | Prettier config (2-space, no semis, double quotes, 100 col, Tailwind plugin) |
| `.prettierignore` | Skip `.next`, `src/generated`, migrations, lockfile |
| `eslint.config.mjs` | Flat config: Next core-web-vitals + TS + `eslint-config-prettier/flat` |
| `src/ts-reset.d.ts` | One-line `import "@total-typescript/ts-reset"` — global stdlib tightening |
| `.prismalintrc.json` | prisma-lint rules |
| `package.json#lint-staged` | Per-extension commands run on staged files |
| `package.json#simple-git-hooks` | The `pre-commit` command |
| `.gitleaks.toml` | Secret-scan allowlist |

## Common operations

### Format the whole repo

```bash
npm run format
```

### Add a new file type to lint-staged

Edit `package.json#lint-staged`. Example — add `.prisma`:

```json
"prisma/schema.prisma": ["prisma-lint"]
```

(Already present — pattern shown for reference.)

### Re-install hooks after cloning / on a new machine

```bash
npm install        # the `prepare` script runs simple-git-hooks
# or explicitly:
npx simple-git-hooks
```

### Add a new pre-commit check

Edit `package.json#simple-git-hooks.pre-commit` — chain commands with `&&`. Re-register with `npx simple-git-hooks`.

### Disable a Prettier conflict in ESLint

Already handled by `eslint-config-prettier/flat` at the end of the config array. Do not re-enable Prettier-conflict rules manually.

## ts-reset implications

After loading, the following return `unknown` instead of `any`:

- `JSON.parse(...)`
- `await response.json()`
- `await response.text()` is unchanged

Pair with the `zod-schemas` skill — every `unknown` should hit a Zod parse before use. The two skills are complementary: ts-reset surfaces the gap, Zod fills it.

## Anti-patterns

- `git commit --no-verify` to bypass a failing hook → fix the cause.
- Inline `// eslint-disable-next-line` without a justification comment.
- Re-enabling Prettier-conflicting ESLint rules.
- Editing `src/generated/` manually.
- `as any` or `@ts-ignore` to silence ts-reset's tighter types — use Zod parse instead.

## Verify

- [ ] `npm run format` → no errors.
- [ ] `npm run lint` → no errors.
- [ ] `npm run typecheck` → no errors.
- [ ] `git commit` on a trivial change → pre-commit runs lint-staged.
- [ ] `ls -la .git/hooks/pre-commit` → file exists and references the simple-git-hooks command.
