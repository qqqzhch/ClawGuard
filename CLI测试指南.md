# CLI 本地测试指南

## 构建后本地测试 CLI 的几种方式

### 1. 直接运行构建产物

```bash
cd packages/cli
node dist/index.js --help
node dist/index.js backup --help
```

### 2. 使用 npm link 全局链接

```bash
cd packages/cli
npm link        # 将包链接到全局
clawguard --help
clawguard backup --level config
```

### 3. 使用 npx 直接执行（推荐）

```bash
cd packages/cli
npx . --help
npx . backup --level config
```

### 4. 在项目中通过脚本测试

在 `packages/cli/package.json` 添加：

```json
{
  "scripts": {
    "test:cli": "node dist/index.js",
    "test:backup": "node dist/index.js backup --level config"
  }
}
```

然后运行：

```bash
npm run test:cli -- --help
npm run test:backup
```

### 5. 使用 pack 模拟真实安装

```bash
cd packages/cli
npm pack                    # 生成 clawguard-1.0.0.tgz
npm i -g ./clawguard-1.0.0.tgz   # 全局安装测试
clawguard --help
```

---

## 推荐方案

- **开发调试**：`npx .` 或 `node dist/index.js`
- **真实环境模拟**：`npm pack` + `npm i -g`
