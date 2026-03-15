# npx . 测试示例

在 `packages/cli` 目录下执行：

## 基础命令

```bash
# 查看帮助
npx . --help

# 查看版本
npx . --version
```

## backup 命令

```bash
# 默认配置备份
npx . backup

# 指定级别和名称
npx . backup --level full --name "weekly-full"

# 指定输出目录并加密
npx . backup --level system --output ./backups --encrypt
```

## diff 命令

```bash
# 比较两个备份
npx . diff backup-001 backup-002

# 指定备份目录
npx . diff id1 id2 --backup-dir ./my-backups

# 忽略某些字段
npx . diff id1 id2 --ignore "timestamp,size"
```

## verify 命令

```bash
# 验证指定备份
npx . verify backup-001

# 验证所有备份
npx . verify --all
```

## schedule 命令

```bash
# 列出所有定时任务
npx . schedule list

# 启用定时任务（每天凌晨2点执行，保留7天）
npx . schedule enable "daily-backup" "config" "0 2 * * *" 7

# 禁用定时任务
npx . schedule disable schedule-001

# 修改保留天数
npx . schedule set-retain-days schedule-001 30
```

## logs 命令

```bash
# 查看最近100条日志
npx . logs

# 按级别过滤
npx . logs --level error

# 查看统计
npx . logs stats

# 清空日志
npx . logs clear
```

## gateway 命令

```bash
# 启动网关服务（默认3000端口）
npx . gateway start

# 指定端口启动
npx . gateway start --port 8080

# 查看服务状态
npx . gateway status
```

---

**原理**：`npx .` 会读取当前目录 `package.json` 的 `bin` 字段，执行 `./dist/index.js`。
