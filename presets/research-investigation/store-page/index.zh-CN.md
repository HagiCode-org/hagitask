---
locale: zh-CN
slug: research-investigation
title: 代码调研
summary: 一个围绕 CodeRef 输出 Vault、可选参考范围和共享 preset-task 规范化输入构建的结构化代码调研 task preset。
eyebrow: Task Preset 商店
status: experimental
primaryCtaLabel: 安装 task preset
secondaryCtaLabel: 查看契约
catalog:
  - research
  - coderef
tags:
  - research
  - vault-scoped
  - investigation
badges:
  - CodeRef 输出
  - 范围结构化
  - 调研就绪
---

代码调研 preset 适合那些希望把代码研究从自由输入和临时 Vault 选择，收敛成稳定契约的团队。

## 为什么团队会安装它

### 以输出 Vault 为起点的 CodeRef 流程

这个 preset 强制选择 1 个 CodeRef 输出 Vault，让最终产物从一开始就有明确的可写归档位置。

### 读写上下文都可显式声明

参考 Vault 和项目引用都需要显式附加，便于把证据来源、读写意图和最终范围一起暴露给用户。

### 不再依赖专用调研抽屉

可选仓库 URL 会走共享 preset-task 提交流程并完成规范化，因此不再需要单独维护一套 research 表单。

## 适用场景

- 适合：调研简报、架构审计、迁移分析，以及需要沉淀到 CodeRef Vault 的仓库感知型研究任务。
- 不适合：无范围约束的实现任务、随手记录，或不需要稳定输出 Vault 的流程。

## 常见问题

### 为什么必须选择输出 CodeRef Vault？

因为这个 preset 的目标是留下可追踪的调研产物。强制输出 Vault 可以避免调研过程漂移到不可管理的临时工作区。

### 项目引用可以是可编辑的吗？

可以。派发前可以把项目引用标记为 `read` 或 `write`，让调研范围和协作方式保持一致。
