---
public: true
multilingual: false
style: product
---

# README requirements

## Product focus

- Present `@hagicode/hagitask` as the offline toolkit for authoring HagiTask preset-task packages: a `hagitask validate` command that checks packages against the shipped schemas, a `hagitask new` command that scaffolds a package, a validation API, and the shipped preset packages `normal-session` and `research-investigation`.
- Address tool authors and preset contributors who create and validate HagiTask packages. This is a developer-facing package and CLI, so commands, schemas and the package `$schema` reference are part of the product.
- Open with what the package does, the npm install and the CLI commands, then how packages are structured.

## Required content

- Keep the npm CLI usage, schema layers, package `$schema` reference, well-known inputs, run mode and the preset package directory, as the current README does.
- Keep a short link or note on how to contribute a preset package, without describing the repository's internal ownership or publication pipeline.
- Schema and input names must match `schemas/` and `presets/`.

## Exclusions

- Exclude npm tokens, secret values, internal hosts, machine-specific paths and private links.
- Keep repository maintenance instructions out of the README: repository layout, generated-output rules, source-of-truth ownership, publication data flow and CI.
- Do not list features the repository does not show.
