# Commit After Feature

After completing any feature, bug fix, or meaningful code change — commit immediately. Do not move to the next task or report completion with uncommitted work.

## Rules

- Stage specific files (`git add <file>` — not `git add -A` or `git add .`)
- Use conventional commit format: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- Subject line under 50 characters, body only when "why" is non-obvious
- When working through multiple tasks (e.g., `opsx:apply`), commit after each independently complete increment
- If a task touches multiple concerns, prefer one commit per concern over one giant commit

## When NOT to commit mid-work

- Partial implementation that would break the build
- Changes that depend on a subsequent step to be functional

In those cases, commit once the full increment is complete.
