---
locale: zh-CN
slug: openspec-spec-compress
title: OpenSpec Spec Compress
summary: 一个内置的 OpenSpec 维护 preset，把文档化的 spec 压缩流程收敛成可复用、默认非交互的任务入口。
eyebrow: Task Preset Store
status: experimental
tags:
  - openspec
  - maintenance
  - spec-compression
---

OpenSpec Spec Compress 是一个面向 `openspec/specs/` 机械清理工作的内置 preset。它把已经写进 `docs/openspec-spec-compression.md` 的压缩流程产品化，不再依赖一次性的手工 prompt。

## 为什么使用 OpenSpec Spec Compress

### 它把写入边界写死在 prompt 里

这个 preset 以 `openspec/specs/` 与 `openspec/specs/archive/` 为核心写入范围，并要求执行器默认不要触碰 active `openspec/changes/`，除非用户明确扩展范围。

### 它固化了安全的压缩节奏

提示词直接携带压缩指南里的关键规则：建立 validate 基线、扁平化 delta 头、用 `git mv` 归档退役 spec、保留活跃 requirement，并且每个逻辑步骤后都重新校验。

### 它默认适配自动化环境

非交互默认行为已经内置在 prompt 中。只要合理假设能让流程继续，执行器就不应停下来追问可选细节。

## 适用场景

- 最适合：在不重做 capability 设计的前提下，降低 OpenSpec spec 的结构性债务。
- 也适合：归档清扫、delta 头清理、机械式规范化处理。
- 不适合：语义级 requirement 改写、补写 `SHALL` / `MUST`、补写 `Scenario`，或大规模 capability 重设计。
