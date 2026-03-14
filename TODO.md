# ClawGuard v1.0 (MVP) 待办事项

> 最后更新：2026-03-14

---

## ✅ 已完成

| 模块 | 功能 | 状态 |
|------|------|------|
| **CLI 框架** | CAC 框架搭建 | ✅ |
| **备份 - Level 1** | 配置文件备份 | ✅ |
| **备份 - Level 2** | 配置 + 系统文件备份 | ✅ |
| **备份 - Level 3** | 完整工作区备份 | ✅ |
| **加密** | encrypt/decrypt/key-manager | ✅ |
| **路径管理** | OpenClaw 路径获取 | ✅ |
| **类型定义** | backup/config/scheduler types | ✅ |
| **错误处理** | 错误类型和代码定义 | ✅ |

---

## ✅ 已完成 (补充)

### 1. CLI 命令

| 命令 | 描述 | 状态 |
|------|------|------|
| `clawguard restore <backup-id>` | 恢复备份到 OpenClaw 目录 | ✅ |
| `clawguard restore <backup-id> --dry-run` | 预演恢复，不实际执行 | ✅ |
| `clawguard list` | 列出所有备份 | ✅ |
| `clawguard security set-key` | 设置/重置加密密钥 | ✅ |

---

### 2. 核心功能模块

| 模块路径 | 需要实现的功能 | 状态 |
|----------|----------------|------|
| `packages/core/src/restore/` | 从备份文件恢复到 OpenClaw 目录 | ✅ |
| `packages/core/src/list/` | 读取 .clawguard/backups，列出备份元数据 | ✅ |
| `packages/core/src/config/` | 读写 .clawguard/config.json | ✅ |
| `packages/core/src/metadata-store/` | 备份元数据持久化管理 | ✅ |

---

## ❌ 未完成

### 1. CLI 命令

| 命令 | 描述 | 状态 |
|------|------|------|
| `clawguard export --level <level>` | 导出备份到指定路径 | ✅ |
| `clawguard export --level <level> --encrypt` | 导出并加密 | ✅ |
| `clawguard import <file>` | 导入外部备份文件 | ✅ |
| `clawguard import <file> --decrypt` | 导入并解密 | ✅ |
| `clawguard diff <id1> <id2>` | 对比两个备份的配置差异 | ✅ |
| `clawguard diff <id1> --ignore <fields>` | 忽略指定字段的对比 | ✅ |
| `clawguard schedule enable --cron <expr>` | 启用定时备份任务 | ✅ |
| `clawguard schedule retain --days <n>` | 设置备份保留天数 | ✅ |
| `clawguard schedule list` | 列出所有定时任务 | ✅ |
| `clawguard gateway start [--port]` | 启动 Web Gateway 服务 | ⏳ |
| `clawguard gateway status` | 查看 Gateway 运行状态 | ⏳ |
| `clawguard verify <backup-id>` | 验证备份文件完整性 | ⏳ |
| `clawguard verify --all` | 验证所有备份 | ⏳ |

---

### 2. 核心功能模块

| 模块路径 | 需要实现的功能 | 状态 |
|----------|----------------|------|
| `packages/core/src/export/` | 导出备份到指定路径（可选加密） | ✅ |
 |
| `packages/core/src/import/` | 导入外部备份文件（可选解密） | ✅ |
 |
| `packages/core/src/diff/` | 对比两个备份的配置差异 | ✅ |
| `packages/core/src/schedule/` | 使用 node-cron 实现定时备份 | ✅ |
| `packages/core/src/verify/` | 验证备份文件的 checksum | ⏳ |

---

### 3. Web UI 管理面板

| 功能模块 | 描述 | 技术建议 | 状态 |
|----------|------|----------|------|
| **后端服务** | HTTP API 服务 | Express / Fastify / Hono | ⏳ |
| **前端框架** | Web UI 界面 | React / Vue / Svelte | ⏳ |
| **配置文件管理** | 可视化展示、在线编辑 | Monaco Editor | ⏳ |
| **工作区管理** | 查看、上传、下载、编辑 | 文件树组件 | ⏳ |
| **备份管理** | 创建、恢复、删除、查看详情 | 列表/详情页 | ⏳ |
| **系统文件查看** | SOUL.md、MEMORY.md 等 | Markdown 渲染 | ⏳ |
| **定时任务管理** | 启停、查看、编辑 cron | Cron 表达式编辑器 | ⏳ |
| **加密设置** | 设置/重置加密密钥 | 表单验证 | ⏳ |

---

### 4. 通用基础设施

| 项目 | 描述 | 状态 |
|------|------|------|
| **元数据存储** | 备份元数据持久化（JSON 文件） | ⏳ |
| **日志系统** | 操作日志记录与查看 | ⏳ |
| **配置管理** | 全局配置文件读写 | ⏳ |

---

## 🎯 建议优先级

### P0（核心功能 - 必须完成）

| 功能 | 说明 |
|------|------|
| **Restore** | 没有恢复功能，备份就失去了意义 |
| **Backup List** | 用户需要查看历史备份 |
| **Metadata Store** | 持久化备份元数据，方便查询 |
| **Config** | 全局配置管理 |

### P1（必要功能 - MVP 完整性）

| 功能 | 说明 |
|------|------|
| **Export/Import** | 备份迁移和分享场景必需 |
| **Schedule** | 自动化备份，减少手动操作 |
| **Verify** | 确保备份完整性，数据安全 |
| **Security Set-Key** | CLI 端设置密钥的入口 |

### P2（增强功能 - 体验提升）

| 功能 | 说明 |
|------|------|
| **Diff** | 配置对比，帮助定位变更 |
| **Web Gateway** | 图形化界面，降低使用门槛 |
| **日志系统** | 操作审计和问题排查 |

---

## 📋 实施计划

### 阶段一：核心功能补全
```
1. packages/core/src/config/         - 配置管理
2. packages/core/src/metadata-store/ - 元数据持久化
3. packages/core/src/restore/        - 恢复功能
4. packages/core/src/list/           - 备份列表
5. CLI 命令：restore, list, security set-key
```

### 阶段二：导入导出与验证
```
1. packages/core/src/export/         - 导出功能
2. packages/core/src/import/         - 导入功能
3. packages/core/src/verify/         - 完整性验证
4. CLI 命令：export, import, verify
```

### 阶段三：定时任务
```
1. packages/core/src/schedule/       - 定时备份
2. CLI 命令：schedule enable, schedule retain, schedule list
3. 集成到 backup 命令（--schedule 选项）
```

### 阶段四：配置对比
```
1. packages/core/src/diff/           - 差异对比
2. CLI 命令：diff
```

### 阶段五：Web UI
```
1. packages/gateway/                 - 新建 gateway 包
2. packages/web-ui/                  - 新建前端包
3. CLI 命令：gateway start, gateway status
```

---

## 🔧 技术选型建议

### 后端服务
- **框架**: Hono（轻量、性能好）或 Fastify
- **认证**: 无需认证（本地工具）
- **CORS**: 允许本地访问

### 前端
- **框架**: React + Vite
- **UI 组件**: shadcn-ui
- **代码编辑器**: @monaco-editor/react
- **Markdown**: react-markdown
- **状态管理**: Zustand 或 Zustand + React Query

### 定时任务
- **库**: node-cron

### 日志
- **库**: pino（高性能）

---

## 📝 注意事项

1. **加密集成**: backup 命令已有 `--encrypt` 选项，但未实际实现加密逻辑
2. **临时文件清理**: level-2.ts 和 level-3.ts 使用了临时文件，需要优化
3. **错误处理**: 添加更详细的错误信息和错误恢复建议
4. **测试覆盖**: 为新功能添加单元测试和集成测试
5. **文档同步**: 功能完成后更新 README 和 CLAUDE.md
