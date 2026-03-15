# ClawGuard Web UI

ClawGuard 的 Web 管理界面，提供图形化的备份、恢复、配置和日志管理功能。

## 技术栈

- React 18 + TypeScript
- Vite 5
- Tailwind CSS
- shadcn/ui 组件库
- Zustand (状态管理)

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm web

# 构建
pnpm build:web
```

## 功能模块

- **备份管理**: 查看列表、创建、恢复、删除备份
- **配置管理**: 在线编辑配置文件
- **定时计划**: 管理 cron 定时备份任务
- **日志查看**: 查看操作日志，按级别过滤
- **系统设置**: 安全设置、存储配置、版本信息

## API 集成

Web UI 通过 Vite proxy 调用 Gateway REST API：

- 默认 API 地址: `http://localhost:3000`
- 开发环境自动代理 `/api` 请求

## 部署

```bash
# 构建
pnpm build:web

# 预览
pnpm --filter @clawguard/web preview
```

构建产物在 `dist/` 目录，可部署到任何静态文件服务器。
