---
description: ALWAYS ACTIVE. Every feature must be reachable via UI navigation from /. Template placeholder surfaces (dashboard skeletons, navbar, README, branding) must be replaced as part of initial implementation and kept current after every feature.
---

# No Orphan Features

A feature does not exist until a user can reach it by clicking from `/`. Building routes without wiring them into navigation, and leaving template placeholder surfaces in place, makes finished work invisible.

## Reachability (every feature)

- **Every user-facing route must be reachable through UI navigation** starting at `/` — via the navbar, the dashboard, or a parent page. A route only reachable by typing its URL is not done.
- When adding a top-level feature area (e.g. `/scenarios`), add a navbar link for signed-in users in `src/components/navbar.tsx` in the same increment.
- Deep routes (`/x/[id]/...`) must be linked from their parent listing page.

## Replace template placeholders (first real feature)

The template ships with placeholder surfaces. Replacing them is part of the **definition of done for the initial implementation** — not a follow-up task:

| Surface | Template state | Required state |
|---------|---------------|----------------|
| `/` (`src/app/page.tsx`) | Static `<Skeleton>` cards | Real dashboard: live counts/data from the app's models, links into the main feature areas |
| `src/components/navbar.tsx` | Logo + avatar only | Links to the app's primary feature areas |
| `README.md` | Describes the hackathon template | Describes the target app: what it does, user flows, key routes/modules, app-specific env vars |
| App name/branding (navbar logo, `layout.tsx` metadata) | Template name | Target app name |

Static `<Skeleton>` components used as permanent page content are placeholders and violate `no-todos-or-partials`.

## Keep docs current (every feature after that)

- When a feature adds a user flow, route area, or env var, update `README.md` in the same change.
- The README's description of the app must always match what is on `main`.

## Checklist (run after completing any feature)

- [ ] Can a signed-in user click from `/` to the new feature?
- [ ] Does `/` still show any template skeletons or placeholder copy?
- [ ] Does `README.md` describe the app as it now exists (flows, routes, env vars)?
