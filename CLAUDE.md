# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**ClawGuard** 是 OpenClaw 的配置管理工具，提供配置文件备份、恢复、迁移和工作区管理功能。

### 产品定位
- CLI 工具（面向开发者、Agent、DevOps）
- Web UI 应用（面向普通用户）
- NPM 包发布
- 本地安装，无云端依赖

---

## 核心功能设计

### 分层备份策略
- **Level 1: 配置文件** - 只备份 `~/.openclaw/` 下的配置文件
- **Level 2: 配置 + 系统文件** - 配置文件 + SOUL.md、USER.md、MEMORY.md 等
- **Level 3: 完整工作区** - 备份整个 `~/.openclaw/workspace/` 目录

### CLI 命令设计

```bash
# 备份
clawguard backup --level config|system|full [--name <name>] [--output <path>]

# 恢复
clawguard restore [<backup-id>] [--dry-run]
clawguard backup list

# 导出/导入
clawguard export --level config|system|full [--output <path>] [--encrypt]
clawguard import <file> [--decrypt]

# 配置对比
clawguard diff <backup-id-1> [<backup-id-2>] [--ignore <fields>]

# 定时任务
clawguard schedule enable --cron <expression>
clawguard schedule retain --days <n>
clawguard schedule list

# Web Gateway
clawguard gateway start [--port <port>]
clawguard gateway status

# 安全
clawguard security set-key
clawguard verify <backup-id> [--all]
```

### Web UI 功能
- 配置文件管理（可视化展示、在线编辑）
- 工作区文件管理（查看、上传、下载、编辑）
- 备份管理（创建、恢复、删除、查看详情）
- 系统文件查看（SOUL.md、MEMORY.md、SUBAGENTS.md 等）
- 定时任务管理
- 加密设置

---

## OpenClaw 目录结构

```
~/.openclaw/
├── workspace/           # 工作区文件
├── SOUL.md              # 灵魂文件
├── USER.md              # 用户文件
├── MEMORY.md           # 长期记忆
├── memory/              # 每日记忆 (YYYY-MM-DD.md)
├── HEARTBEAT.md         # 心跳文件
├── TOOLS.md             # 工具文件
├── AGENTS.md            # 代理文件
└── SUBAGENTS.md         # 子代理文件
```

---

## 技术栈建议

### CLI
- **框架**: Commander.js 或 CAC
- **压缩**: tar、gzip
- **加密**: crypto (Node.js 内置) 或 crypto-js
- **调度**: node-cron
- **日志**: winston 或 pino

### Web UI
- **框架**: Express / Fastify / Hono
- **前端**: React / Vue / Svelte
- **UI 组件**: shadcn-ui / Element Plus / Quasar
- **代码编辑器**: Monaco Editor (VS Code 编辑器)
- **Markdown 渲染**: marked / react-markdown

---

## 发展路线

### v1.0 (MVP)
- CLI 命令行工具
- Web UI 管理面板
- 分层备份/恢复/导出/导入
- 工作区管理
- 系统文件查看
- 基本加密/验证
- 定时任务管理

### v1.1
- 配置对比 (diff)
- 备份保留策略可视化
- 命令历史记录
- 操作日志查看

### v1.2
- 远程同步（S3、Git）
- 备份分析
- 多账户支持
- 主题切换

### v2.0 (企业版)
- 单点登录 (SSO)
- 企业级权限管理
- 监控系统集成
- 多租户支持
