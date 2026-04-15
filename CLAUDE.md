# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a hackday project template built around **OpenSpec** — a spec-driven development workflow. The repository provides scaffolding for structured feature development using a CLI-driven artifact system.

## OpenSpec Workflow

The core tool is the `openspec` CLI. All development follows a change-based flow:

### Commands (slash commands)

| Command | Purpose |
|---------|---------|
| `/opsx:explore [topic]` | Enter thinking/exploration mode — read-only, no implementation |
| `/opsx:propose [name]` | Create a new change and generate all artifacts (proposal, design, tasks) |
| `/opsx:apply [name]` | Implement tasks from a change |
| `/opsx:archive [name]` | Archive a completed change |

### Key CLI Commands

```bash
openspec list --json                                    # List all active changes
openspec new change "<name>"                            # Scaffold a new change
openspec status --change "<name>" --json               # Check artifact status
openspec instructions <artifact-id> --change "<name>" --json  # Get artifact creation instructions
openspec instructions apply --change "<name>" --json   # Get implementation instructions
```

### Directory Structure

```
openspec/
  config.yaml                          # Project schema + context + per-artifact rules
  changes/
    <change-name>/
      .openspec.yaml                   # Change metadata
      proposal.md                      # What & why
      design.md                        # How
      tasks.md                         # Implementation checklist (- [ ] / - [x])
      specs/<capability>/spec.md       # Delta specs (change-scoped)
    archive/
      YYYY-MM-DD-<change-name>/        # Archived completed changes
  specs/
    <capability>/spec.md               # Main canonical specs
```

### Config

`openspec/config.yaml` uses `schema: spec-driven` and optionally accepts:
- `context`: Free-form text describing the tech stack, conventions, domain — shown to AI when generating artifacts
- `rules`: Per-artifact overrides (e.g., `proposal`, `tasks`) for custom constraints

### Artifact Lifecycle

Artifacts are created in dependency order. The `applyRequires` field in `openspec status --json` defines which artifacts must be `done` before implementation can begin. Typically: `proposal.md` → `design.md` → `tasks.md`.

When archiving, delta specs (`openspec/changes/<name>/specs/`) are optionally synced to the main specs (`openspec/specs/<capability>/spec.md`) before the change directory is moved to `archive/`.

### Task Tracking

Tasks in `tasks.md` use standard markdown checkboxes. Mark complete immediately after finishing each task:
- `- [ ]` pending
- `- [x]` complete
