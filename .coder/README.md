---
display_name: Hackday AI
description: Vibe coding workspace with NextJS, Postgres, and Claude Code ready to go
icon: ../../../site/static/icon/k8s.png
verified: true
tags: [kubernetes, claudecode, nextjs, postgres, hackday]
---

# Hackday AI Workspace

A [Coder](https://coder.com/docs/workspaces) template that provisions a ready-to-go "vibe coding" environment for Hackday projects. Spin up a workspace and start building — the scaffolding is already done.

## What You Get

- **NextJS starter app** cloned from [hackathon-template](hackathon-template), auto-installed and running on first start
- **Postgres 18 with pgvector** running as a sidecar, wired up via `DATABASE_URL` and `PG*` env vars
- **Prisma** migrations applied automatically on startup
- **Claude Code** preinstalled and preconfigured against the internal LiteLLM gateway (Opus, Sonnet, Haiku all available)
- **OIDC auth** prewired via `AUTH_URL`, `AUTH_SECRET`, `AUTH_OIDC_ID`, `AUTH_OIDC_ISSUER`
- **code-server** (VS Code in browser) with the Claude Code extension installed
- **tmux** session running `npm run dev` so the app is live from boot
- **Public app URL** exposed on a Coder subdomain (authenticated sharing)

## Architecture

Single pod, two containers:

| Container | Image                          | Purpose                                               |
| --------- | ------------------------------ | ----------------------------------------------------- |
| `dev`     | `codercom/example-node:ubuntu` | Your workspace — Node, Claude Code, code-server, tmux |
| `db`      | `pgvector/pgvector:pg18`       | Postgres with pgvector extension                      |

Persistence:

- `/home/coder` — persistent volume (survives workspace restarts)
- Postgres data directory — separate 100Gi persistent volume

## Workspace Parameters

| Parameter      | Default | Options   |
| -------------- | ------- | --------- |
| CPU            | 4 cores | 2 / 4 / 8 |
| Memory         | 4 GB    | 2 / 4 / 8 |
| Home disk size | 10 GB   | 1–99999   |

Memory is split automatically: ~70% to the dev container, ~25% to Postgres. Node heap is tuned to ~60% of the dev container's memory.

## Startup Flow

1. `git-clone` module pulls the hackathon template into `/home/coder/project`
2. `next.config.ts` is patched to allow the workspace's public hostname as a dev origin
3. `npm install` → `prisma generate` → `prisma migrate deploy`
4. `npm run dev` starts inside a tmux session named `app`
5. Access the running app via the `app` Coder app (opens in a new tab)

## Secrets

The template reads from AWS Secrets Manager at `hackathon/coder-ai`. The secret must be a JSON object with the following keys:

- `litellm_admin_key` — auth for the LiteLLM gateway
- `auth_oidc_id` — OIDC client ID for the NextJS app
- `auth_oidc_issuer` — OIDC issuer URL

The Coder provisioner needs AWS credentials with `secretsmanager:GetSecretValue` on that secret (IRSA, instance profile, or standard credential chain). Region is resolved from the `AWS_REGION` environment variable.

## Customising

This template is a starting point. Fork the [hackathon-template](hackathon-template) repo to change the scaffolded app, or edit `main.tf` to change resources, add modules, or swap the database image.
