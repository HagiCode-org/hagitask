---
locale: en-US
slug: goal
title: Goal
summary: A bundled sustained-work preset that routes work through `/goal` and limits execution to compatible Claude and Codex heroes.
eyebrow: Task Preset Store
status: experimental
tags:
  - sustained-work
  - repository-scoped
  - compatibility-aware
---

Goal is a bundled sustained-work preset for work that should keep a single objective in focus while still respecting repository boundaries and compatible hero routing.

## Why use Goal

### It keeps the objective explicit

Goal captures one sustained-work objective and routes it through the `/goal` command surface so the run stays focused on the primary outcome.

### It filters heroes to compatible executors

Only heroes backed by compatible Claude or Codex executor families are shown for Goal, preventing invalid hero choices before queueing work.

### It still keeps repository scope explicit

Like other preset tasks, Goal only writes to repositories the user explicitly selects with write access.

## Best fit

- Best for: sustained implementation or debugging runs that should keep advancing a single objective.
- Also good for: long-running cleanup, migration, or rollout work that benefits from non-interactive continuation.
- Not for: open-ended brainstorming, vault-heavy research, or tasks that require incompatible hero families.
