---
locale: en-US
slug: research-investigation
title: Research Investigation
summary: A structured CodeRef research task preset that routes investigation work through an explicit output vault, optional reference scope, and preset-task input normalization.
eyebrow: Task Preset Store
status: experimental
primaryCtaLabel: Install task preset
secondaryCtaLabel: Preview contract
catalog:
  - research
  - coderef
tags:
  - research
  - vault-scoped
  - investigation
badges:
  - CodeRef output
  - Structured scope
  - Investigation ready
---

Research Investigation is a task preset package for teams that want code research to start from a clear contract instead of a free-form prompt and ad hoc vault selection.

## Why teams install it

### Output-first CodeRef workflow

The preset requires one CodeRef output vault so the final artifacts have a stable writable destination from the start.

### Mixed read and write context

Reference vaults and project references can be attached explicitly, which keeps evidence sources visible while preserving access intent.

### Repository intake without custom drawers

Optional repository URLs are normalized through the shared preset-task flow, so research intake can stay structured without a special-purpose form.

## Best fit

- Best for: investigation briefs, architecture audits, migration analysis, and repository-aware research tasks that should land inside a CodeRef vault.
- Not for: unrestricted implementation tasks, casual note capture, or workflows that do not need a stable output vault.

## FAQ

### Why force an output CodeRef vault?

The preset is designed to leave a durable research artifact. Requiring the output vault prevents the run from drifting into an untracked workspace.

### Can reference projects be editable?

Yes. Project references can be marked as `read` or `write` before dispatch so the research scope matches the intended collaboration mode.
