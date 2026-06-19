---
locale: en-US
slug: ui-master
title: UI Master
summary: A structured UI task preset that combines command-guided intent, repository scope, and scene-aware dispatch for focused interface work.
eyebrow: Task Preset Store
status: experimental
primaryCtaLabel: Install task preset
secondaryCtaLabel: Preview contract
catalog:
  - ui
  - design-tools
tags:
  - scene-aware
  - repository-scoped
  - command-driven
badges:
  - Scene-aware
  - Repository scoped
  - Command driven
---

UI Master is a task preset package for teams that want UI requests to start from a clearer structure than a single free-text brief.

## Why teams install it

### Command-guided task framing

Users select an explicit UI command before dispatch, which gives the task preset a more stable starting point for routing, prompt construction, and review.

### Scene-aware execution

The task preset can bind to a scene provider so hero selection and execution framing stay consistent with the UI Master operating model.

### Controlled repository scope

Repository access remains explicit. That makes the task preset safer to expose in shared workspaces where not every UI task should see every repository.

## Best fit

- Best for: intentional UI work, design refinements, interaction cleanup, and implementation-focused interface tasks.
- Not for: open-ended research dumps, backend-only changes, or tasks that need unrestricted project execution.

## FAQ

### Can this task preset edit every repository in a project by default?

No. Repository access is declared as task preset input and should stay visible to the user before dispatch.

### Why keep a command catalog instead of only a free-text brief?

The catalog helps normalize user intent and gives the task preset a more stable structure for routing and prompt construction.
