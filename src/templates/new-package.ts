export interface NewPackageTemplateContext {
  packageName: string;
  repositories: string[];
}

export interface NewPackageFile {
  path: string;
  contents: string;
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function createNewPackageFiles(context: NewPackageTemplateContext): NewPackageFile[] {
  const { packageName, repositories } = context;
  const localized = (key: string) => ({ key });
  const repositoryOptions = repositories.map((value) => ({
    value,
    label: localized(`repositories.${value}`),
  }));

  return [
    {
      path: 'manifest.json',
      contents: json({
        $schema: '../../schemas/task-preset-plugin/manifest.schema.json',
        schemaVersion: '1.0',
        taskPresetId: packageName,
        version: '1.0.0',
        icon: 'sparkles',
        displayName: localized('taskPreset.displayName'),
        description: localized('taskPreset.description'),
        kind: 'custom-executor',
        status: 'experimental',
        owner: 'HagiTask',
        activation: { defaultState: 'passive' },
        localization: {
          strategy: 'plugin-bundles',
          namespace: packageName,
          defaultLocale: 'en-US',
          supportedLocales: ['en-US', 'zh-CN'],
          bundles: {
            'en-US': './locales/en-US.json',
            'zh-CN': './locales/zh-CN.json',
          },
        },
        capabilities: { supportsCommandCatalog: true },
        ui: {
          panel: './frontend/panel.json',
          commands: './frontend/commands.json',
        },
        site: { storePage: './store-page/' },
        backend: {
          taskPreset: './backend/task-preset.json',
          prompts: './backend/prompts.json',
        },
      }),
    },
    {
      path: 'frontend/panel.json',
      contents: json({
        $schema: '../../../schemas/task-preset-plugin/panel.schema.json',
        surface: 'drawer',
        title: localized('taskPreset.title'),
        description: localized('taskPreset.description'),
        defaultTitle: localized('taskPreset.defaultTitle'),
        submitLabel: localized('taskPreset.submit'),
        submittingLabel: localized('taskPreset.submitting'),
        sections: [{
          id: 'context',
          layout: 'stack',
          fields: [{
            id: 'targetRepositories',
            renderer: 'repository-access-selector',
            label: localized('panel.repositoryLabel'),
            hint: localized('panel.repositoryHint'),
            required: true,
            output: 'targetRepositories',
            selectionMode: 'multiple',
            componentProps: {
              targetSelectionId: 'targetRepositories',
              emptyTextKey: 'panel.repositoryEmpty',
              options: repositoryOptions,
            },
          }],
        }],
      }),
    },
    {
      path: 'frontend/commands.json',
      contents: json({
        $schema: '../../../schemas/task-preset-plugin/commands.schema.json',
        schemaVersion: '1.1',
        selectionMode: 'multiple',
        groups: [{
          id: 'repository-analysis',
          title: localized('commands.groupTitle'),
          description: localized('commands.groupDescription'),
        }],
        commands: [
          {
            id: 'what-is-this',
            groupId: 'repository-analysis',
            label: 'what is this',
            description: localized('commands.whatIsThisDescription'),
            docsSlug: 'what-is-this',
          },
          {
            id: 'what-is-next',
            groupId: 'repository-analysis',
            label: 'what is next',
            description: localized('commands.whatIsNextDescription'),
            docsSlug: 'what-is-next',
          },
        ],
      }),
    },
    {
      path: 'backend/task-preset.json',
      contents: json({
        $schema: '../../../schemas/task-preset-plugin/task-preset.schema.json',
        taskKey: `${packageName}.repositoryAnalysis`,
        scriptKey: `hagitask.${packageName}`,
        defaultTargetType: 'repository',
        execution: { schemaVersion: '1.0', strategy: 'extension', extensionPoint: 'hagitask.command-analysis' },
        requirements: [{ type: 'agent', name: 'any' }],
        targets: {
          repositories: {
            enabled: true,
            selections: [{
              id: 'targetRepositories',
              selectionMode: 'multiple',
              allowedAccessTypes: ['read'],
              output: 'targetRepositories',
              required: true,
              scope: { source: 'owner-project-repositories' },
            }],
          },
          vaults: { enabled: false },
          projects: { enabled: false },
        },
        inputBindings: [
          {
            input: 'targetRepositories',
            promptParameter: 'targetRepositories',
            metadataKey: 'targetRepositories',
            valueType: 'multiple',
            transform: 'string-list',
            required: true,
            producer: 'field-output',
          },
        ],
      }),
    },
    {
      path: 'backend/prompts.json',
      contents: json({
        $schema: '../../../schemas/task-preset-plugin/prompt-package.schema.json',
        version: '1.0.0',
        templateEngine: 'handlebars',
        defaultLocale: 'en-US',
        supportedLocales: ['en-US', 'zh-CN'],
        inputs: [
          {
            name: 'targetRepositories',
            source: 'task-preset-input',
            required: true,
            description: 'One or more explicitly selected repository identifiers.',
          },
          {
            name: 'targetRepositoriesSelectAll',
            source: 'computed-context',
            required: false,
            description: 'Optional. True when the repository scope is the resolved select-all state; absent or false means an explicit list.',
          },
          {
            name: 'targetRepositoriesScopeAccess',
            source: 'computed-context',
            required: false,
            description: 'Optional. Access of the resolved select-all scope: write or read. Present only when targetRepositoriesSelectAll is true.',
          },
        ],
        rendering: { strictVariables: true, trimBlocks: true },
        locales: {
          'en-US': {
            systemTemplate: './templates/en-US/system.md',
            userTemplate: './templates/en-US/user.hbs',
          },
          'zh-CN': {
            systemTemplate: './templates/zh-CN/system.md',
            userTemplate: './templates/zh-CN/user.hbs',
          },
        },
        commandSystemPrompts: {
          'what-is-this': {
            'en-US': './templates/en-US/commands/what-is-this.md',
            'zh-CN': './templates/zh-CN/commands/what-is-this.md',
          },
          'what-is-next': {
            'en-US': './templates/en-US/commands/what-is-next.md',
            'zh-CN': './templates/zh-CN/commands/what-is-next.md',
          },
        },
      }),
    },
    {
      path: 'locales/en-US.json',
      contents: json({
        $schema: '../../../schemas/task-preset-plugin/locales.schema.json',
        taskPreset: {
          displayName: packageName,
          title: `Create ${packageName}`,
          description: 'Analyze explicitly selected repositories.',
          defaultTitle: packageName,
          submit: 'Run analysis',
          submitting: 'Running analysis...',
        },
        panel: {
          repositoryLabel: 'Repositories',
          repositoryHint: 'Select one or more repositories. Analysis never chooses an implicit target.',
          repositoryEmpty: 'Select a repository before running an analysis.',
        },
        commands: {
          groupTitle: 'Repository analysis',
          groupDescription: 'Understand the selected repository and plan improvements.',
          whatIsThisDescription: 'Explain the purpose and structure of the selected repository.',
          whatIsNextDescription: 'Recommend actionable next improvements for the selected repository.',
        },
        repositories: Object.fromEntries(repositories.map((value) => [value, value])),
      }),
    },
    {
      path: 'locales/zh-CN.json',
      contents: json({
        $schema: '../../../schemas/task-preset-plugin/locales.schema.json',
        taskPreset: {
          displayName: packageName,
          title: `创建 ${packageName}`,
          description: '分析明确选择的仓库。',
          defaultTitle: packageName,
          submit: '运行分析',
          submitting: '正在运行分析……',
        },
        panel: {
          repositoryLabel: '仓库',
          repositoryHint: '选择一个或多个仓库。分析不会隐式选择目标。',
          repositoryEmpty: '运行分析前请先选择仓库。',
        },
        commands: {
          groupTitle: '仓库分析',
          groupDescription: '了解选定仓库并规划改进。',
          whatIsThisDescription: '说明选定仓库的用途和结构。',
          whatIsNextDescription: '为选定仓库推荐可执行的后续改进。',
        },
        repositories: Object.fromEntries(repositories.map((value) => [value, value])),
      }),
    },
    {
      path: 'backend/templates/en-US/system.md',
      contents: 'You analyze only the repositories listed in {{targetRepositories}}.\n',
    },
    {
      path: 'backend/templates/en-US/user.hbs',
      contents: 'Use the selected repository context to answer the requested analysis.\n',
    },
    {
      path: 'backend/templates/en-US/commands/what-is-this.md',
      contents: 'Describe what the selected repository does, its main structure, and key entry points.\n',
    },
    {
      path: 'backend/templates/en-US/commands/what-is-next.md',
      contents: 'Recommend prioritized, actionable improvements for the selected repository.\n',
    },
    {
      path: 'backend/templates/zh-CN/system.md',
      contents: '你只能分析 {{targetRepositories}} 中明确选择的仓库。\n',
    },
    {
      path: 'backend/templates/zh-CN/user.hbs',
      contents: '使用选定仓库上下文回答请求的分析问题。\n',
    },
    {
      path: 'backend/templates/zh-CN/commands/what-is-this.md',
      contents: '说明选定仓库的用途、主要结构和关键入口。\n',
    },
    {
      path: 'backend/templates/zh-CN/commands/what-is-next.md',
      contents: '为选定仓库推荐有优先级且可执行的改进方向。\n',
    },
    {
      path: 'store-page/index.en-US.md',
      contents: `# ${packageName}\n\nA scaffold for repository analysis.\n`,
    },
    {
      path: 'store-page/index.zh-CN.md',
      contents: `# ${packageName}\n\n用于仓库分析的脚手架包。\n`,
    },
    {
      path: 'commands/README.md',
      contents: '# Command extensions\n\n`what is this` explains a selected repository. `what is next` recommends improvements. Add new command IDs to `frontend/commands.json` and matching prompt files under `backend/templates/<locale>/commands/`.\n',
    },
  ];
}
