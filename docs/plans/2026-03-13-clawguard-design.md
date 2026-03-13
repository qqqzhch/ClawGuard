# ClawGuard v1.0 设计文档

**项目代号：** ClawGuard
**版本：** v1.0.0
**创建日期：** 2026-03-13
**目标用户：** OpenClaw 用户、开发者、运维人员、企业用户

---

## 概述

**ClawGuard** 是 OpenClaw 的配置管理工具，提供配置文件备份、恢复、迁移和工作区管理功能。

**核心特性：**
- CLI 命令行工具（开发者专用）
- Web UI 管理面板（普通用户专用）
- 分层备份策略（Level 1/2/3）
- 加密和验证
- 定时任务管理

---

## 项目结构

采用 **Monorepo** 结构，使用 **pnpm workspace** 管理，npm 打包时将 Web UI 静态资源打包到 CLI 中：

```
clawguard/
├── packages/
│   ├── core/              # 核心业务逻辑（CLI 和 Web UI 共享）
│   │   ├── src/
│   │   │   ├── backup/     # 备份逻辑
│   │   │   ├── restore/    # 恢复逻辑
│   │   │   ├── export/     # 导出逻辑
│   │   │   ├── import/     # 导入逻辑
│   │   │   ├── diff/       # 对比逻辑
│   │   │   ├── encryption/ # 加密逻辑
│   │   │   ├── scheduler/  # 定时任务逻辑
│   │   │   ├── paths/      # 路径管理
│   │   │   ├── errors/     # 错误处理
│   │   │   └── types/      # 类型定义
│   │   └── package.json
│   ├── cli/               # CLI 命令行工具（最终发布包）
│   │     ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── backup.ts
│   │   │   │   ├── restore.ts
│   │   │   │   ├── export.ts
│   │   │   │   ├── import.ts
│   │   │   │   ├── diff.ts
│   │   │   │   ├── schedule.ts
│   │   │   │   ├── security.ts
│   │   │   │   └── gateway.ts
│   │   │   ├── server/      # Web API 服务
│   │   │   │   ├── index.ts
│   │   │   │   ├── routes/
│   │   │   │   └── middleware/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── public/         # Web UI 静态资源（打包时从 web/dist 复制）
│   │   └── package.json
│   └── web/               # Web UI 开发环境（不发布）
│       ├── server/         # Hono 后端开发代码
│       │   └── src/
│       │       ├── routes/
│       │       ├── middleware/
│       │       └── index.ts
│       └── client/         # React 前端开发代码 (Vite)
│           ├── src/
│           │   ├── components/
│           │   ├── pages/
│           │   ├── hooks/
│           │   ├── api/
│           │   └── main.tsx
│           └── dist/       # 打包后的静态资源（复制到 cli/public）
├── package.json
├── pnpm-workspace.yaml
└── scripts/
    └── build-all.js        # 构建脚本
```

### 打包流程

1. 开发时：`pnpm --filter @web/clawguard dev` 启动 Web 开发环境
2. 构建时：`pnpm run build`
   - 构建 web/client → 生成 web/client/dist
   - 将 web/client/dist 复制到 cli/public
   - 将 web/server/src 复制到 cli/src/server
3. 发布时：`pnpm publish` 只发布 @cli/clawguard 包

### 用户使用流程

- 普通用户：`npm install -g clawguard` → `clawguard gateway start` 打开 Web UI
- 开发人员：使用 CLI 命令（backup、restore、export、import 等）

---

## 核心模块设计

### @core/clawguard

**核心业务逻辑模块，不依赖 CLI 或 Web 框架：**

```
src/
├── backup/
│   ├── index.ts           # backup 入口
│   ├── level-1.ts         # 配置文件备份
│   ├── level-2.ts         # 配置 + 系统文件备份
│   ├── level-3.ts         # 完整工作区备份
│   └── metadata.ts        # 备份元数据管理
├── restore/
│   ├── index.ts           # restore 入口
│   ├── list.ts            # 列出所有备份
│   └── verify.ts         # 备份验证
├── export/
│   ├── index.ts           # export 入口
│   ├── level-1.ts         # 只导出配置文件 (JSON)
│   ├── level-2.ts         # 导出配置 + 系统文件 (tar.gz)
│   └── level-3.ts         # 导出完整工作区 (tar.gz)
├── import/
│   ├── index.ts           # import 入口
│   └── parse.ts           # 解析导入文件
├── diff/
│   ├── index.ts           # diff 入口
│   └── compare.ts         # 配置对比逻辑
├── encryption/
│   ├── index.ts           # 加密/解密入口
│   ├── encrypt.ts         # AES-256 加密
│   ├── decrypt.ts         # AES-256 解密
│   └── key-manager.ts     # 密钥管理
├── scheduler/
│   ├── index.ts           # 定时任务入口
│   ├── cron.ts            # Cron 表达式解析
│   ├── retain.ts          # 保留策略
│   └── notify.ts          # 通知逻辑
├── paths/
│   ├── index.ts           # OpenClaw 路径管理
│   ├── openclaw-root.ts   # 获取 ~/.openclaw 路径
│   ├── config-files.ts    # 配置文件路径
│   ├── system-files.ts    # 系统文件路径
│   └── workspace.ts       # 工作区路径
├── errors/
│   ├── index.ts
│   ├── types.ts
│   └── codes.ts
├── types/
│   ├── index.ts
│   ├── backup.ts
│   ├── config.ts
│   └── scheduler.ts
└── index.ts               # 导出所有公共 API
```

### @cli/clawguard

**CLI 命令行工具，使用 CAC 框架：**

```
src/
├── index.ts              # CLI 入口
├── commands/
│   ├── backup.ts         # backup 命令
│   ├── restore.ts        # restore 命令
│   ├── export.ts          # export 命令
│   ├── import.ts          # import 命令
│   ├── diff.ts            # diff 命令
│   ├── schedule.ts        # schedule 命令
│   ├── security.ts        # security 命令
│   └── gateway.ts        # gateway 命令
├── server/               # Web API 服务
│   ├── index.ts           # 启动 Hono 服务
│   ├── routes/
│   │   ├── backup.ts
│   │   ├── restore.ts
│   │   ├── export.ts
│   │   ├── import.ts
│   │   ├── diff.ts
│   │   ├── files.ts      # 文件管理
│   │   └── system.ts     # 系统文件查看
│   └── middleware/
│       ├── auth.ts
│       └── error.ts
├── utils/
│   ├── logger.ts          # 日志工具
│   └── spinner.ts         # 加载动画
└── public/                # Web UI 静态资源（打包后）
```

### @web/clawguard

**Web UI 开发环境：**

**后端（Hono）：**
```
server/
└── src/
    ├── index.ts
    ├── routes/
    │   ├── backup.ts
    │   ├── restore.ts
    │   ├── export.ts
    │   ├── import.ts
    │   ├── diff.ts
    │   ├── files.ts
    │   └── system.ts
    └── middleware/
        ├── cors.ts
        └── error.ts
```

**前端（React + Vite）：**
```
client/
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── components/
    │   ├── Layout.tsx
    │   ├── FileTree.tsx
    │   ├── CodeEditor.tsx
    │   └── BackupCard.tsx
    ├── pages/
    │   ├── Config.tsx
    │   ├── Workspace.tsx
    │   ├── SystemFiles.tsx
    │   ├── Memory.tsx
    │   ├── Backups.tsx
    │   └── Settings.tsx
    ├── hooks/
    │   ├── useBackups.ts
    │   └── useFiles.ts
    ├── api/
    │   └── client.ts
    └── vite.config.ts
```

---

## CLI 命令设计

```bash
# 备份
clawguard backup --level <config|system|full> [--name <name>] [--output <path>] [--encrypt]

# 恢复
clawguard restore [--id <backup-id>] [--dry-run]

# 导出
clawguard export --level <config|system|full> [--output <path>] [--encrypt]

# 导入
clawguard import <file> [--decrypt]

# 对比
clawguard diff <id-1> [id-2] [--ignore <fields>]

# 定时任务
clawguard schedule enable --cron <expression>
clawguard schedule disable
clawguard schedule list
clawguard schedule retain --days <n>

# 安全
clawguard security set-key
clawguard verify <backup-id> [--all]

# Web Gateway
clawguard gateway start [--port <port>]
clawguard gateway status
```

---

## Web API 设计

**RESTful API 设计：**

```
# 备份相关
GET    /api/backup/list              # 获取备份列表
POST   /api/backup/create            # 创建备份
POST   /api/backup/restore/:id        # 恢复备份
DELETE /api/backup/:id               # 删除备份
GET    /api/backup/:id               # 获取备份详情

# 文件管理
GET    /api/files/tree               # 获取文件树
GET    /api/files/content/*           # 获取文件内容
POST   /api/files/upload             # 上传文件
DELETE /api/files/*                  # 删除文件
PUT    /api/files/*                  # 更新文件

# 系统文件
GET    /api/system/soul              # 获取 SOUL.md
GET    /api/system/memory            # 获取 MEMORY.md
GET    /api/system/memory/:date       # 获取每日记忆
GET    /api/system/subagents         # 获取子代理配置

# 导出/导入
POST   /api/export/:level            # 导出配置
POST   /api/import                   # 导入配置

# 对比
POST   /api/diff                    # 对比备份
```

---

## Web UI 布局设计

```
┌──────────────────────────────────────────────────────────┐
│  顶部导航：[配置] [工作区] [系统] [记忆] [备份] [设置]  │
└──────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────────────────┐
│  左侧面板          │        右侧内容区                      │
│                  │                                      │
│  ├ 文件树         │        └── 当前选中内容的预览/编辑        │
│  ├ 记忆时间线      │        └── 操作按钮                       │
│  └ 备份列表        │                                       │
└──────────────────┴──────────────────────────────────────┘
```

---

## 错误处理设计

**错误类型：**

| 错误类型 | HTTP 状态码 |
|---------|------------|
| FileNotFoundError | 404 |
| PermissionError | 403 |
| ValidationError | 400 |
| BackupError | 500 |
| RestoreError | 500 |
| EncryptionError | 500 |

**错误代码：**

```
`BACKUP_FAILED`        # 备份失败
`RESTORE_FAILED`       # 恢复失败
`EXPORT_FAILED`        # 导出失败
`IMPORT_FAILED`        # 导入失败
`ENCRYPTION_FAILED`    # 加密失败
`DECRYPTION_FAILED`    # 解密失败
`FILE_NOT_FOUND`       # 文件未找到
`PERMISSION_DENIED`     # 权限拒绝
`INVALID_CONFIG`       # 无效配置
`UNKNOWN_ERROR`        # 未知错误
```

---

## 技术栈

### 核心依赖
- **Node.js 22**（原生 TypeScript 支持）
- **TypeScript**（类型安全）
- **pnpm**（Monorepo 管理）

### CLI
- **CAC**（命令行框架）
- **winston/pino**（日志）
- **ora/spinners**（加载动画）

### Web UI
- **Hono**（后端框架）
- **React + Vite**（前端框架）
- **Monaco Editor**（代码编辑器）
- **shadcn-ui**（UI 组件）

### 测试
- **Vitest**（单元测试）
- **Playwright**（E2E 测试）

---

## 测试策略

### 单元测试
- 覆盖核心业务逻辑
- 备份逻辑测试（mock 文件系统）
- 加密/解密测试
- 定时任务测试
- 路径管理测试

### 集成测试
- 命令参数解析
- 命令输出格式
- API 端点测试

### E2E 测试
- 备份/恢复流程
- 文件上传/下载
- 配置编辑

---

## 开发流程

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发环境
pnpm dev

# 3. 运行测试
pnpm test

# 4. 构建
pnpm build

# 5. 本地测试 npm 包
npm install -g packages/cli

# 6. 发布
pnpm publish
```

---

## 设计原则

1. **核心共享**：CLI 和 Web UI 共享核心业务逻辑
2. **分层清晰**：命令层、核心层、数据层分离
3. **类型安全**：全栈 TypeScript
4. **极简依赖**：使用零依赖框架（Hono）
5. **本地优先**：无云端依赖，数据不出设备
6. **加密安全**：AES-256-GCM 加密
7. **跨平台**：支持 Windows、macOS、Linux

---

**文档版本：** 1.0.0
**最后更新：** 2026-03-13
