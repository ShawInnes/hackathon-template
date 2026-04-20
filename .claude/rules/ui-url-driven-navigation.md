---
description: ALWAYS ACTIVE. All navigable UI state (tabs, filters, pagination, modals) must be reflected in the URL for deep linking. Never use client-only state for switchable views.
---

# URL-Driven Navigation State

All navigable UI state must be reflected in the URL to support deep linking and browser history. This includes tabs, filters, sort order, pagination, modal open/close, and any other state a user would expect to share or bookmark.

## Implementation Patterns (in order of preference)

1. **Route segments**: Use Next.js dynamic routes (`src/app/settings/[tab]/page.tsx`) for top-level navigation tabs or views. This is the default choice for tabs.
2. **Search params**: Use `useSearchParams()` for secondary state like filters, sort, pagination, or modal triggers (e.g. `?filter=active&sort=name`). Update via `router.push()` or `router.replace()` — never with `useState` alone.
3. **Never use client-only state for navigable views.** If switching a tab, opening a panel, or changing a filter does not update the URL, the implementation is wrong. A user copying the URL and pasting it in a new browser tab must land on the same view.

## Checklist

- [ ] Does the URL change when the user switches views?
- [ ] Does pasting the URL in a new tab restore the correct view?
- [ ] Does browser back/forward navigate between views correctly?
