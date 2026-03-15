# ClawGuard

OpenClaw 配置管理工具，提供配置文件备份、恢复、迁移和工作区管理功能。

## 功能特性

- **三级备份策略**：配置文件 / 系统文件 / 完整工作区
- **加密支持**：AES-256-GCM 加密保护敏感数据
- **定时任务**：自动备份与保留策略
- **差异对比**：备份文件版本对比
- **Web 界面**：可视化配置管理
- **操作日志**：完整的操作审计追踪

## 快速开始

### 安装

```bash
# 使用 pnpm
pnpm install

# 构建所有包
pnpm build
```

### CLI 使用

```bash
# 创建备份
clawguard backup --level config --name my-backup

# 查看备份列表
clawguard backup list

# 对比两个备份
clawguard diff <backup-id-1> <backup-id-2>

# 验证备份完整性
clawguard verify <backup-id>

# 设置定时备份
clawguard schedule enable "daily-backup" "config" "0 2 * * *" 30

# 查看操作日志
clawguard logs --limit 50

# 启动 Web Gateway
clawguard gateway start --port 3000
```

### Web 界面

```bash
# 启动开发服务器
pnpm web

# 或构建后通过 Gateway 访问
pnpm gateway
```

## 项目结构

```
packages/
├── core/          # 核心库（备份、加密、日志等）
├── cli/           # 命令行工具
├── gateway/       # Web API 网关
└── web/           # React 前端界面
```

## 技术栈

- **语言**: TypeScript
- **构建**: tsup / Vite
- **测试**: Vitest / Playwright
- **CLI**: cac
- **Web**: React + Tailwind CSS + Radix UI
- **API**: Hono

## 开发命令

```bash
pnpm dev          # 开发模式
pnpm build        # 构建所有包
pnpm test         # 运行测试
pnpm lint         # 代码检查
pnpm typecheck    # 类型检查
```

## 许可证

MIT
