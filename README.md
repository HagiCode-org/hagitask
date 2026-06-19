# hagitask

HagiTask is the canonical repository for preset-task contribution assets inside the
HagiCode monorepo. It is the maintained source of truth for shipped preset-task
schemas and preset packages.

> Authoring location: contributors add and update preset-task packages **here**, in
> `repos/hagitask`, not in `repos/hagicode-core/src/PCode.Web/plugins/task-presets/`.
> The `hagicode-core` copy is a transitional asset that is kept only until the backend
> loading cutover lands.

## Repository Layout

```text
repos/hagitask/
  schemas/
    task-preset-plugin/
      manifest.schema.json        # Preset package manifest contract
      panel.schema.json           # Frontend panel definition contract
      commands.schema.json        # Frontend command catalog contract
      locales.schema.json         # Locale bundle contract
      task-preset.schema.json     # Backend task-preset contract
      prompt-package.schema.json  # Backend prompt package contract
  presets/
    <presetTaskId>/
      manifest.json
      frontend/
        panel.json
        commands.json             # Optional, only when the preset ships commands
      backend/
        task-preset.json
        prompts.json
        templates/<locale>/...
      locales/
        en-US.json
        zh-CN.json
      store-page/
        index.en-US.md
        index.zh-CN.md
```

## Schema Directory

`schemas/task-preset-plugin/` is the authoritative home for the JSON schemas that
validate preset packages. Every shipped and community preset package resolves its
`$schema` references against this directory, so contributors never need files from
`repos/hagicode-core` to validate a package.

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

## Preset Package Directory

`presets/` is the root for preset-task packages. Each package lives in its own
`presets/<presetTaskId>/` directory and preserves the loader-compatible plugin
package shape (`manifest.json`, `frontend/`, `backend/`, `locales/`, and
`store-page/`). This means the backend can load migrated packages without a
HagiTask-specific adapter.

Currently shipped packages:

- `claude-md-update`
- `last30days`
- `normal-session`
- `ponytail`
- `research-investigation`
- `ui-master`

## Source-of-Truth Ownership

HagiTask owns preset-task schemas and shipped preset packages. When you add a new
preset, update an existing one, or change a schema, do it here.

The legacy copies under `repos/hagicode-core/src/PCode.Web/plugins/task-presets/`
are kept unchanged during the copy-first transition phase. After the later backend
loading cutover (see `openspec/changes/migrate-preset-task-to-hagitask-repo`),
`hagicode-core` will load shipped presets from `repos/hagitask/presets` through the
`TaskPresetPlugins.PresetGroups` configuration and the backend-owned copy will no
longer be the shipped source of truth.

## Contributing a Preset Package

1. Create `presets/<presetTaskId>/` with the loader-compatible layout shown above.
2. Point every JSON file's `$schema` at `../../schemas/task-preset-plugin/...`
   (or `../../../schemas/...` for files inside `frontend/`, `backend/`, `locales/`).
3. Include the full runtime resource set the backend needs: `manifest.json`,
   `frontend/panel.json`, `backend/task-preset.json`, `backend/prompts.json`,
   locale bundles, locale prompt templates, and `store-page/` content.
4. Validate each JSON file against its schema before submitting.
