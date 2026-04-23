# Dev Server & Builds

This is a hackathon template. Optimise for fast iteration — avoid slow, unnecessary commands.

## Do not run `npm run build`

Do not run `npm run build` to verify changes. It is slow and not needed during hackathon work. TypeScript errors surface in the dev server and editor. Only run `npm run build` if the user explicitly asks for a production build or is debugging a build-only issue.

## Dev server runs in tmux

The workspace starts the Next.js dev server in a tmux session named `app` with working directory `/home/coder/project`. The startup command is:

```bash
tmux new-session -d -s app -c /home/coder/project 'npm run dev; exec bash' 2>/dev/null \
  || tmux send-keys -t app 'cd /home/coder/project && npm run dev' Enter
```

### Before starting or restarting

1. Check whether the `app` session exists: `tmux has-session -t app 2>/dev/null && echo running || echo missing`
2. If it exists, inspect its output: `tmux capture-pane -t app -p | tail -50`
3. Confirm the dev server is actually running (look for `Ready in` / `Local:` / compilation output) — the session can exist while the process has exited to a `bash` prompt.

Never start a second dev server outside the `app` session — port 3000 conflicts will cause silent failures.

### Smart start / restart

Use these exact recipes. They are idempotent and match how the workspace itself starts the server.

**Start (only if not running):**

```bash
tmux new-session -d -s app -c /home/coder/project 'npm run dev; exec bash' 2>/dev/null \
  || tmux send-keys -t app 'cd /home/coder/project && npm run dev' Enter
```

**Restart (when config changes require a full restart — `next.config.*`, env vars, new dependencies):**

```bash
tmux send-keys -t app C-c
sleep 1
tmux send-keys -t app 'npm run dev' Enter
```

**Do not restart for code changes.** Next.js hot-reloads TSX, route, and style edits automatically. Only restart for:

- Changes to `next.config.ts` / `next.config.js`
- Changes to `.env*` files
- New package installs (`npm install <pkg>`)
- Prisma client regeneration (`npm run prisma:migrate` or `npx prisma generate`)
- Middleware or `proxy.ts` structural changes that HMR fails to pick up
