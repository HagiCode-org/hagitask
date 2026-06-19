---
locale: zh-CN
slug: last30days
title: last30days
summary: 一个结构化研究 task preset，把共享 preset-task 输入映射成具备模式感知能力的 `last30days` 工作流，并显式保留仓库范围。
eyebrow: Task Preset 商店
status: experimental
primaryCtaLabel: 安装 task preset
secondaryCtaLabel: 查看契约
catalog:
  - research
  - analysis
tags:
  - research
  - repository-scoped
  - command-driven
badges:
  - 研究导向
  - 仓库范围受控
  - 模式感知
---

last30days 适合那些希望把近期市场或社区研究收敛成稳定结构，而不是直接抛给执行器一大段自由文本的团队。

## 为什么团队会安装它

### 模式感知的查询塑形

用户在派发前先选定 general、comparison、competitors 或 prompting 模式，让 preset 拿到更稳定的研究契约。

### 明确的仓库边界

仓库范围和 `read` / `write` 权限始终显式可见，便于把研究结论锚定到正确代码库，同时避免范围悄悄扩大。

### 以 skill 为中心的执行方式

这个 preset 会优先走已安装的 `/last30days` skill，并把非交互默认行为直接写进提示词，更适合自动化环境。

## 适用场景

- 适合：近期市场扫描、工具对比、竞品发现，以及和仓库上下文有关的研究简报。
- 不适合：无范围约束的实现任务、长时间跨度的历史研究，或依赖交互澄清的流程。

## 常见问题

### 这个 preset 会顺便帮我安装 last30days skill 吗？

不会。它默认运行环境已经安装并可用 `/last30days`。

### 它能修改所有被选中的仓库吗？

不能。只有用户显式标为 `write` 的仓库可写；被标为 `read` 的仓库只能作为参考上下文。
