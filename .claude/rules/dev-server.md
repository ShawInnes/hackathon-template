# Dev Server & Builds

This is a hackathon template. Optimise for fast iteration — avoid slow, unnecessary commands.

## Do not run `npm run build`

Do not run `npm run build` to verify changes. It is slow and not needed during hackathon work. TypeScript errors surface in the dev server and editor. Only run `npm run build` if the user explicitly asks for a production build or is debugging a build-only issue.

## Dev server runs in tmux

`npm run dev` should already be running inside a tmux session. Before starting it:

1. Check running tmux sessions: `tmux ls`
2. Check windows in each session: `tmux list-windows -t <session>`
3. Attach or inspect output: `tmux capture-pane -t <target> -p`

Only start `npm run dev` yourself if no tmux session is running it. Never start a second dev server — port conflicts will cause confusion.
