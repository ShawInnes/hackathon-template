<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- ASTRYX:START -->
Astryx v0.1.8 · 153 components
CLI: run every command as `npx astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — discover, don't guess. Before writing UI:
1. `astryx build "<idea>"` — START HERE: returns a kit (closest [page] + [block]s + [component]s). No args = full playbook.
2. `astryx template <name> [--skeleton]` — scaffold the [page]/[block]s it named, or study their layout. Templates are reference code.
3. `astryx component <Name>` — props + examples for every component you use.

RULES:
- No <div> — components do all layout/spacing. Full page → AppShell; sidebar nav → SideNav.
- Frame first: pick the shell (AppShell / Layout+LayoutPanel) and budget regions in px BEFORE writing content (`astryx docs layout`).
- Dense data = rows (Table, List/Item) edge-to-edge — never Card-wrapped list items. Card = dashboard widgets, galleries, settings groups only.
- Status → StatusDot/Token; Badge only for counts and enumerated states, never decoration.
- Custom styling: component props first; else Tailwind utilities backed by tokens (bg-surface, text-primary, rounded-lg) via tailwind-theme.css. No raw hex/px.
- Tokens for every value (`astryx docs tokens`). Brand/accent via `astryx theme` — never override --color-* in :root.
- SELF-CHECK before you finish: re-read the file and replace any style={{…}}, raw <div>/<span> layout, imported .css/@apply, or hardcoded/arbitrary value (e.g. bg-[#fff], p-[13px]) with the component or a token-backed utility. If unsure a component/prop exists, run `astryx component <Name>` / `astryx search "<thing>"`; don't hand-roll CSS.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   153 components by category
  template --list    page + block recipes
  docs <topic>       color, elevation, icons, illustrations, internationalization, layout, migration, motion, principles, shape, spacing, styling, theme, tokens, typography
  swizzle <Name>     eject component source for deep customization
  upgrade --apply    run after any @astryxdesign/core bump
<!-- ASTRYX:END -->

## Interior micro-interactions

Interior is the default source for interaction patterns: https://www.interior.dev/docs/.
It distributes copyable React source, not an npm component package. Its runtime
dependency, `motion`, is included; import animation APIs from `motion/react`.

- Discover Astryx primitives first, then read the matching Interior page's usage,
  source, and props before implementing motion or feedback. Useful starting points:
  `copy-button`, `loading-button`, `skeleton-swap`, `value-flash`, and `reorder-list`.
- Reuse existing local implementations. Save adapted components in
  `src/components/interior/<pattern>.tsx` and import from `@/components/interior/...`.
  Include the source page URL in the file. Copy only patterns the feature needs.
- Keep Astryx responsible for components, layout, and design tokens. Adapt Interior's
  behavior to those primitives; do not paste its raw layout wrappers, hardcoded
  colors/dimensions, arbitrary Tailwind values, or inline styling into this app.
  Check Astryx's documented ref/prop support before applying Motion to a component.
- Keep `"use client"` at the interactive leaf. Pass application actions and data in
  through props; keep pages/layouts as Server Components where possible.
- Preserve reduced-motion handling (`useReducedMotion`), stable dimensions across
  states, interruptible transitions, keyboard/focus behavior, and accessible status
  feedback. Motion must never be the only way a user can understand a state change.
- Verify rapid repeated input, async success/failure, unmount cleanup, keyboard use,
  and reduced motion when adapting a pattern.
