# hagitask

[![npm version](https://img.shields.io/npm/v/%40hagicode%2Fhagitask?logo=npm&color=cb3837)](https://www.npmjs.com/package/@hagicode/hagitask)
[![npm downloads](https://img.shields.io/npm/dm/%40hagicode%2Fhagitask?logo=npm&color=2d8cf0)](https://www.npmjs.com/package/@hagicode/hagitask)
[![license](https://img.shields.io/npm/l/%40hagicode%2Fhagitask?color=ffd43b)](https://www.npmjs.com/package/@hagicode/hagitask)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

HagiTask is the offline toolkit for authoring HagiTask preset-task packages. It ships a
`hagitask validate` command that checks packages against the shipped schemas, a
`hagitask new` command that scaffolds a package, a validation API, and the preset
packages `normal-session` and `research-investigation`.

## npm CLI

The toolkit is published as `@hagicode/hagitask` (Node.js 24 or newer).
Install it with `npm install --save-dev @hagicode/hagitask`, then validate a
repository or one package:

```bash
npx hagitask validate .
npx hagitask validate ./data/my-task --json
```

Create a new package scaffold without network access:

```bash
npx hagitask new my-task
npx hagitask new my-task --target ./data/my-task --repository repos/web repos/hagicode-core
```

The target directory must be empty (or absent), and package names use lowercase
letters, numbers, and hyphens. `--target` selects the exact package directory (its final directory name must match the package name);
`--destination` and `--output` are aliases. `--repository` may be repeated or
followed by multiple identifiers and only populates the repository selector
options; commands still require an explicit `targetRepositories` selection.

Generated packages contain `manifest.json`, `frontend/`, `backend/`, bilingual
`locales/`, `store-page/`, and `commands/README.md`. The baseline commands
`what is this` explain a selected repository, while `what is next` recommends
improvements. Add command definitions in `frontend/commands.json` and matching
localized prompt files in `backend/templates/<locale>/commands/`.

`validate` discovers packages directly under `presets/` and `data/`, or validates
a directory containing `manifest.json`. It returns exit code `0` only when all
discovered packages pass. Human-readable diagnostics are printed by default;
`--json` prints the stable `{ packages, errors, valid }` result on stdout for CI.
Validation reads `schemas/` shipped inside the npm package (and never requires a
network connection).

## Schema Layers

`schemas/` holds three schema layers. They validate different documents, at different
points in the pipeline.

| Layer | Schemas | Validates |
| --- | --- | --- |
| Package schemas | `schemas/task-preset-plugin/*.schema.json` | the JSON files inside a preset or community package (`manifest.json`, `frontend/*`, `backend/*`, `locales/*`) |
| Community discovery schema | `schemas/community-index-v1.schema.json` | the published `/index.json` catalog |
| Community detail schema | `schemas/community-task-detail-v1.schema.json` | each published `/tasks/<taskId>.json` document |

Package schemas describe **authored source**. The community schemas describe
**generated publication output** and carry fields that do not exist in any package file
(`generatedAt`, `detailUrl`, `packageUrl`, `integrity.sha256`, and so on). Choosing the
wrong layer is the most common source of confusion: if you are editing a file inside a
package directory, the matching contract is always under `schemas/task-preset-plugin/`.

## Package `$schema` Reference

`schemas/task-preset-plugin/` is the authoritative home for the JSON schemas that
validate preset packages. Every shipped and community preset package resolves its
`$schema` references against this directory.

The shipped preset packages use these relative `$schema` paths from inside
`presets/<presetTaskId>/`:

| Package file                       | `$schema` path                                                          |
|------------------------------------|-------------------------------------------------------------------------|
| `manifest.json`                    | `../../schemas/task-preset-plugin/manifest.schema.json`                 |
| `frontend/panel.json`              | `../../../schemas/task-preset-plugin/panel.schema.json`                 |
| `frontend/commands.json`           | `../../../schemas/task-preset-plugin/commands.schema.json`              |
| `backend/task-preset.json`         | `../../../schemas/task-preset-plugin/task-preset.schema.json`           |
| `backend/prompts.json`             | `../../../schemas/task-preset-plugin/prompt-package.schema.json`        |
| `locales/<locale>.json`            | `../../../schemas/task-preset-plugin/locales.schema.json`               |

Prompt packages may optionally declare `commandSystemPrompts`, mapping a command id
to locale-specific system-template paths:

```json
{
  "commandSystemPrompts": {
    "initialize": {
      "en-US": "./templates/en-US/commands/initialize.md",
      "zh-CN": "./templates/zh-CN/commands/initialize.md"
    }
  }
}
```

The selected command template is rendered with the same context as the user and
base system templates. Locale resolution uses an exact match, then the language
portion, then the package default locale. Missing mappings, blank commands, and
legacy packages simply omit the additional system section. Final prompt order is
user prompt, command-specific system prompt, then base system prompt; existing
command preludes remain supported.

Community packages use the identical values, so a package can move between
`presets/<presetTaskId>/` and the community repository without rewriting references.

## Well-Known Input: `omitNonInteractiveHints`

`omitNonInteractiveHints` is a reserved, optional, boolean system input for prompt
packages. It tells the template whether interactive control is enabled for the agent CLI
that runs the task. A package that wants to follow the switch declares the input in
`backend/prompts.json`:

```json
{
  "name": "omitNonInteractiveHints",
  "source": "system",
  "required": false,
  "description": "Optional. True when interactive control is enabled for the agent CLI running this prompt."
}
```

and gates its run-mode declaration in each template that carries one:

```handlebars
{{#unless omitNonInteractiveHints}}
## Run mode
This prompt is running in a non-interactive environment.
{{/unless}}
```

- **What to gate.** The whole run-mode section: the "non-interactive" declaration, its
  prohibitions of interactive tools or follow-up questions, and the default-choice rules
  written inside it. Keep everything outside that section, including scope boundaries,
  output format, and inline body requirements such as "if details are missing, make a
  reasonable assumption". A statement that the package's own requirements demand (for
  example "do not claim extra skills configuration is required") may stay under an
  `{{else}}` branch with a neutral heading.
- **Absent means today's prompt.** A value that is absent, or `false`, renders exactly the
  prompt that existed before the gate. A package that never references the input renders
  the same way with any value.
- **The backend supplies the value.** The host reads the stored interactive-control entry
  of the agent CLI that runs the task and passes it at render time. It is not a creation
  parameter: package panels, `inputBindings` and create requests must not declare or send it.
  Packages that adopt the input should keep it out of their panel and binding definitions.
- **Wording only.** The switch never changes which runs may ask the user a question. It
  only decides whether the gated run-mode text is rendered.

## Well-Known Computed Inputs: `targetRepositoriesSelectAll` and `targetRepositoriesScopeAccess`

When a session's repository scope is the select-all state ("every repository of the
project", editable or read-only), the backend resolves it against the project's current
repositories at render time and passes two computed-context values to the template:

| Input                            | Value                                                                                          |
|----------------------------------|------------------------------------------------------------------------------------------------|
| `targetRepositoriesSelectAll`    | `true` only when a select-all state was resolved for the session. `false` for an explicit list. |
| `targetRepositoriesScopeAccess`  | `write` (editable) or `read` (read-only) for the resolved scope. Present only when the flag is `true`. |

A package that wants to state the scope declares both in `backend/prompts.json`:

```json
{
  "name": "targetRepositoriesSelectAll",
  "source": "computed-context",
  "required": false,
  "description": "Optional. True when the repository scope is the resolved select-all state; absent or false means an explicit list."
},
{
  "name": "targetRepositoriesScopeAccess",
  "source": "computed-context",
  "required": false,
  "description": "Optional. Access of the resolved select-all scope: write or read. Present only when targetRepositoriesSelectAll is true."
}
```

- **What the values mean.** When the flag is `true`, `targetRepositories` already holds the
  full resolved set and `targetScopeMarkdown` is recomputed from it, so a template only
  needs the flag to say that the scope is all repositories. The list is not a snapshot.
- **What to gate.** Wrap any all-repositories wording in `{{#if targetRepositoriesSelectAll}}`
  and read the access value only inside that gate. An explicit-list session renders the
  same prompt it rendered before.
- **Packages with `strictVariables: true`.** The backend supplies `false` for an explicit
  list, so the flag is always present for those packages. Packages with
  `strictVariables: false` may ignore the flag entirely.
- **The backend supplies the values.** They are not creation parameters: package panels,
  `inputBindings` and create requests must not declare or send them.

## Preset Package Directory

`presets/` is the root for preset-task packages. Each package lives in its own
`presets/<presetTaskId>/` directory and preserves the loader-compatible plugin
package shape (`manifest.json`, `frontend/`, `backend/`, `locales/`, and
`store-page/`).

Currently shipped packages:

- `normal-session`
- `research-investigation`

`agents-md-update`, `goal`, `last30days`, `openspec-spec-compress`, `ponytail`, and
`ui-master` are published as community tasks and live in
[`hagitask-community-packages`](https://github.com/HagiCode-org/hagitask-community-packages),
not in `presets/`.

## Contributing a Preset Package

Preset packages use the loader-compatible
layout described above and must keep their JSON resources aligned with
`schemas/task-preset-plugin/`. Validate authored files against those schemas before submitting:

```bash
pnpm run validate
```

The validator checks every shipped preset, all manifest resource references, package
JSON schemas, prompt template references, and compatibility binding aliases.

For the user-facing walkthrough covering package creation, locale and store-page resources,
validation, semantic versioning, and Pull Requests, see the
[HagiTask community guide](https://docs.hagicode.com/guides/hagitask/community/). A community
task belongs in
[`hagitask-community-packages`](https://github.com/HagiCode-org/hagitask-community-packages),
not in this repository.