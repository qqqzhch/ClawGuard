# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

### 构建
```bash
pnpm build         # 构建所有包
pnpm build:cli     # 仅构建 CLI
pnpm build:core    # 仅构建 core 包
```

### 测试
```bash
pnpm test          # 运行所有测试（Vitest）
pnpm test:cli      # 运行 CLI 测试
pnpm test:core     # 运行 core 包测试
pnpm test:e2e      # 运行端到端测试（Playwright）
```

### 代码质量
```bash
pnpm lint          # ESLint 检查
pnpm format        # Prettier 格式化
pnpm typecheck     # TypeScript 类型检查
```

## 项目架构

这是一个使用 pnpm workspace 的 monorepo，包含两个核心包：

### packages/core
核心库，提供以下功能模块：

- **backup** (`packages/core/src/backup/`): 三级备份系统
  - `level-1.ts`: 仅备份配置文件（JSON 格式）
  - `level-2.ts`: 备份配置 + 系统文件（tar.gz 格式）
  - `level-3.ts`: 完整工作区备份（tar.gz 格式）

- **encryption** (`packages/core/src/encryption/`): 加密/解密
  - `encrypt.ts`: 数据加密
  - `decrypt.ts`: 数据解密
  - `key-manager.ts`: 密钥管理

- **paths** (`packages/core/src/paths/`): OpenClaw 路径管理
  - `openclaw-root.ts`: OpenClaw 根目录路径
  - `config-files.ts`: 配置文件路径
  - `system-files.ts`: 系统文件路径
  - `workspace.ts`: 工作区路径

- **errors** (`packages/core/src/errors/`): 错误处理
- **types** (`packages/core/src/types/`): TypeScript 类型定义

### packages/cli
CLI 工具，使用 cac 构建命令行界面。当前支持的命令：
```bash
clawguard backup --level <level> --name <name> --output <path> --encrypt
```

备份级别：`config`（默认）、`system`、`full`

### Logs 命令
```bash
clawguard logs [--level] [--command] [--backup-id] [--schedule-id] [--limit] [--offset]  # 列出日志
clawguard logs stats              # 查看日志统计
clawguard logs clear              # 清空所有日志
```

## 技术栈

- **构建工具**: tsup
- **包管理**: pnpm workspace
- **测试**: Vitest + Playwright
- **CLI**: cac
- **加密**: Node.js crypto API
- **压缩**: tar npm 包

## 开发注意事项

- 使用 `ES2022` 和 `ESNext` 模块
- 严格的 TypeScript 配置（`strict: true`）
- 测试文件放在 `__tests__` 目录内
- 所有输出使用 `.clawguard/backups` 目录作为默认备份位置
