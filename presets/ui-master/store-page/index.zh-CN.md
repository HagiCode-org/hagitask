---
locale: zh-CN
slug: ui-master
title: UI Master
summary: 一个面向结构化 UI 任务的 task preset，把命令驱动意图、仓库范围和场景化派发组合到同一个契约里。
eyebrow: Task Preset 商店
status: experimental
primaryCtaLabel: 安装 task preset
secondaryCtaLabel: 查看契约
catalog:
  - ui
  - design-tools
tags:
  - scene-aware
  - repository-scoped
  - command-driven
badges:
  - 场景感知
  - 仓库范围受控
  - 命令驱动
---

UI Master 适合那些不希望 UI 请求只从一段自由描述开始，而是希望先把任务结构收紧、再进入执行阶段的团队。

## 为什么团队会安装它

### 命令驱动的任务成型

用户在派发前先选定明确的 UI 意图，让 task preset 从清晰方向启动，而不是只接收模糊自由文本。

### 场景感知执行

task preset 可以绑定 scene provider，让 hero 选择和执行 framing 保持一致。

### 可控的仓库范围

仓库访问范围始终显式声明，更适合暴露在共享工作区里。

## 适用场景

- 适合：需要明确意图的 UI 工作、设计润色、交互梳理，以及实现导向的界面任务。
- 不适合：开放式调研、纯后端改动，或需要无约束项目执行权限的任务。

## 常见问题

### 这个 task preset 默认能修改项目下所有仓库吗？

不能。仓库访问必须作为 task preset 输入显式声明，并在派发前对用户可见。

### 为什么还要保留命令目录，而不是只靠自由描述？

命令目录可以把用户意图规范化，让路由和 prompt 构造都建立在更稳定的结构上。
