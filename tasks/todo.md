# Interior default integration

- [x] Confirm Interior's installation model and review existing UI guidance.
- [x] Include Motion as a default dependency.
- [x] Document Interior discovery, source ownership, and Astryx adaptation for agents and users.
- [x] Run repository verification and review the final diff.

## Review

Added `motion` ^12.42.2 with its dependency graph and integrity hashes from an
existing local npm lockfile. Verified manifest/lockfile consistency, dependency
ranges, and React peers. Added Interior guidance to AGENTS.md, CLAUDE.md, scoped
Claude UI rules, the component scaffolding skill, and README.md.

Passed typecheck, lint, format:check, all 9 tests, and git diff --check. Markdown is
excluded by the repository's existing Prettier configuration; reviewed manually.

Installation could not be completed: the package-manager wrapper cannot write its
local files in this sandbox, the underlying npm CLI cannot resolve the registry,
and offline lockfile regeneration needs an uncached existing Tailwind package.
A clean install remains unverified; no component source was copied prematurely.

Commit attempted per repository rules, but the sandbox denied creation of
`.git/index.lock`. Changes remain uncommitted.
