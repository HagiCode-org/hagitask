---
locale: en-US
slug: last30days
title: last30days
summary: A structured research task preset that maps shared preset-task input into a mode-aware `last30days` workflow with explicit repository scope.
eyebrow: Task Preset Store
status: experimental
primaryCtaLabel: Install task preset
secondaryCtaLabel: Preview contract
catalog:
  - research
  - analysis
tags:
  - research
  - repository-scoped
  - command-driven
badges:
  - Research focused
  - Repository scoped
  - Mode aware
---

last30days is a task preset package for teams that want recent market or community research to start from a stable structure instead of an unbounded free-form prompt.

## Why teams install it

### Mode-aware query shaping

Users choose whether they want general research, comparison, competitor discovery, or prompting-oriented analysis before dispatch. That gives the preset a cleaner contract than a single large textarea.

### Explicit repository boundaries

Repository scope stays visible and typed as `read` or `write`, so research can stay grounded in the right codebases without quietly expanding access.

### Skill-first execution

The preset is designed to route work through the installed `/last30days` skill and keep non-interactive defaults explicit for automation-friendly runs.

## Best fit

- Best for: recent market scans, tool comparisons, competitor discovery, and repository-aware research briefs.
- Not for: unrestricted implementation tasks, long-horizon historical research, or flows that depend on interactive clarification.

## FAQ

### Does this preset install the external last30days skill for me?

No. The preset assumes the runtime already has `/last30days` installed and available.

### Can it write into every selected repository?

No. Write access is limited to repositories that the user explicitly marked as `write`; `read` repositories remain reference-only.
