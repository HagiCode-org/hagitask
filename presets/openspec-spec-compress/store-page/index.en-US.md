---
locale: en-US
slug: openspec-spec-compress
title: OpenSpec Spec Compress
summary: A bundled OpenSpec maintenance preset that turns the documented spec-compression workflow into a reusable, non-interactive task entry.
eyebrow: Task Preset Store
status: experimental
tags:
  - openspec
  - maintenance
  - spec-compression
---

OpenSpec Spec Compress is a bundled preset for mechanical cleanup work inside `openspec/specs/`. It packages the documented compression workflow into a reusable preset-task entry instead of relying on hand-written one-off prompts.

## Why use OpenSpec Spec Compress

### It keeps the write boundary explicit

The preset is designed around `openspec/specs/` and `openspec/specs/archive/`. It tells the executor to stay away from active `openspec/changes/` content unless the user explicitly expands scope.

### It standardizes the safe compression workflow

The prompt carries the same guardrails described in `docs/openspec-spec-compression.md`: establish a validation baseline, flatten delta headers, archive retired specs with `git mv`, preserve active requirements, and rerun validation incrementally.

### It is automation-friendly by default

Non-interactive defaults are built into the prompt. The executor should not stop for optional clarification when a reasonable assumption keeps the workflow moving.

## Best fit

- Best for: reducing structural OpenSpec spec debt without redesigning the capabilities themselves.
- Also good for: archive sweeps, delta-header cleanup, and mechanical spec normalization.
- Not for: semantic requirement rewriting, missing `SHALL` / `MUST` fixes, missing `Scenario` authoring, or broad capability redesign.
