---
locale: en-US
slug: ponytail
title: Ponytail
summary: A structured task preset that routes work through the Ponytail efficiency ladder and its focused review, audit, debt, and help commands.
eyebrow: Task Preset Store
status: experimental
tags:
  - efficiency
  - repository-scoped
  - command-driven
  - skills-first
badges:
  - Efficiency focused
  - Repository scoped
  - Command aware
---

Ponytail is a task preset for teams that want a built-in guardrail against over-engineering. It turns the shared preset-task drawer into a skill-first workflow where one command decides both the active Ponytail skill and, when relevant, the intensity level.

## Why use ponytail

### It pressures every task toward the shortest working path

Ponytail starts with YAGNI, then checks the standard library, native platform features, already-installed dependencies, one-liners, and only then allows fresh code.

### It keeps repository scope explicit

Like other preset tasks, Ponytail keeps selected repositories visible and typed as `read` or `write`, so simplification never becomes an excuse for touching the wrong codebase.

### It covers more than build mode

The same preset also exposes `review`, `audit`, `debt`, and `help`, so users can inspect over-engineering, scan a repo, track deferred shortcuts, or pull up a quick reference without switching to another preset.

## How the ladder works

1. Skip speculative work.
2. Prefer the standard library.
3. Prefer native platform features.
4. Reuse already-installed dependencies.
5. Prefer the one-line version.
6. Only then write the minimum new code that works.

The ladder never overrides trust-boundary validation, data-loss prevention, security controls, or accessibility basics.

## Modes explained

- `lite`: Build what was asked, but mention the lazier alternative.
- `full`: Default mode. Enforce the ladder and keep the diff short.
- `ultra`: Push back on unnecessary scope and ship the harshest minimal version.

Auxiliary commands stay available through the same picker:

- `review`: code or diff review for over-engineering.
- `audit`: repo-wide complexity scan.
- `debt`: ledger of `ponytail:` shortcuts.
- `help`: quick reference card.

## Best fit

- Best for: implementation tasks that tend to attract boilerplate, dependency creep, or speculative abstractions.
- Also good for: focused review passes, cleanup audits, and teams that want a faster default path in non-interactive automation.
- Not for: work that genuinely needs broad architecture expansion, extensive stakeholder clarification, or a deliberately maximal solution.

## FAQ

### What do I need installed first?

The preset requires `skills:ponytail` and expects the full Ponytail bundle to be available, including `ponytail-review`, `ponytail-audit`, `ponytail-debt`, and `ponytail-help`.

### How do I pick a mode?

Choose a command in the picker. `full` is the recommended starting point, while `lite` and `ultra` adjust how aggressively Ponytail applies the ladder.

### Is Ponytail suitable for every task?

No. It is best when you want the simplest correct path. If the requirement truly needs a fuller build, Ponytail can still execute it, but it will keep challenging unneeded complexity.
