# Logging System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现操作日志系统，提供日志记录、查询和管理功能

**Architecture:** 使用 pino 作为日志库，实现 JSON 格式结构化日志，支持文件持久化和日志轮转。日志系统包含三个核心组件：logger（日志写入）、store（日志存储）、query（日志查询）。

**Tech Stack:** pino (日志库), fs-extra (文件操作), TypeScript

---

## File Structure

```
packages/core/src/
├── logger/
│   ├── index.ts           # 导出所有 logger 模块
│   ├── logger.ts          # 日志写入接口
│   ├── store.ts           # 日志存储（文件持久化）
│   ├── query.ts           # 日志查询接口
│   └── __tests__/
│       ├── logger.test.ts
│       ├── store.test.ts
│       └── query.test.ts
├── types/
│   └── logger.ts          # 日志类型定义
```

---

## Chunk 1: 日志类型定义

### Task 1: Create logger types

**Files:**
- Create: `packages/core/src/types/logger.ts`

- [ ] **Step 1: Create logger types file**

```typescript
import type { LogEntry } from './logger.js';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  command?: string;
  operation?: string;
  backupId?: string;
  scheduleId?: string;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface LogQueryOptions {
  level?: LogLevel;
  command?: string;
  backupId?: string;
  schedule startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  successRate: number;
}
```

- [ ] **Step 2: Update types index to export logger types**

**Files:**
- Modify: `packages/core/src/types/index.ts`

Add line:
```typescript
export * from './logger.js';
```

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/types/logger.ts packages/core/src/types/index.ts
git commit -m "feat(types): add logger type definitions"
```

---

## Chunk 2: Logger 核心（日志写入）

### Task 2: Create logger instance

**Files:**
- Create: `packages/core/src/logger/logger.ts`

- [ ] **Step 1: Create logger implementation**

```typescript
import pino from 'pino';
import path from 'node:path';
import { ensureDirSync } from 'fs-extra';
import type { LogLevel, LogEntry } from '../types/logger.js';
import { getOpenClawRoot } from '../paths/index.js';

const LOG_DIR = path.join('.clawguard', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'clawguard.log');

// Ensure log directory exists
try {
  const root = getOpenClawRoot();
  ensureDirSync(path.join(root, LOG_DIR));
} catch {
  // Silent fail if OpenClaw root not found
}

export const logger = pino({
  level: 'info',
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
      {
        target: 'pino/file',
        options: {
          destination: LOG_FILE,
          mkdir: true,
        },
      },
    ],
  },
});

export interface LogContext {
  command?: string;
  operation?: string;
  backupId?: string;
  scheduleId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export function logInfo(message: string, context?: LogContext): void {
  logger.info({ ...context }, message);
}

export function logWarn(message: string, context?: LogContext): void {
  logger.warn({ ...context }, message);
}

export function logError(message: string, error?: Error, context?: LogContext): void {
  logger.error(
    {
      ...context,
      error: error?.message,
      stack: error?.stack,
    },
    message
  );
}

export function logDebug(message: string, context?: LogContext): void {
  logger.debug({ ...context }, message);
}

export function logSuccess(message: string, context?: LogContext): void {
  logger.info({ ...context, success: true }, message);
}
```

- [ ] **Step 2: Install pino dependencies**

```bash
pnpm add -w pino pino-pretty
pnpm add -w -D @types/pino
```

- [ ] **Step 3: Create logger test**

**Files:**
- Create: `packages/core/src/logger/__tests__/logger.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import pino from 'pino';
import { logger, logInfo, logWarn, logError, logDebug, logSuccess } from '../logger.js';

vi.mock('pino', () => ({
  default: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log info message', () => {
    logInfo('Test message');
    expect(logger.info).toHaveBeenCalled();
  });

  it('should log warn message', () => {
    logWarn('Warning message');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should log error with error object', () => {
    const error = new Error('Test error');
    logError('Error message', error);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Test error' }),
      'Error message'
    );
  });

  it('should log debug message', () => {
    logDebug('Debug message');
    expect(logger.debug).toHaveBeenCalled();
  });

  it('should log success message', () => {
    logSuccess('Success message');
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
      'Success message'
    );
  });

  it('should include context in log', () => {
    const context = { command: 'backup', backupId: '123' };
    logInfo('Backup started', context);
    expect(logger.info).toHaveBeenCalledWith(context, 'Backup started');
  });
});
```

- [ ] **Step 4: Run tests**

```bash
pnpm test:core
```

Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/logger/logger.ts packages/core/src/logger/__tests__/logger.test.ts package.json pnpm-lock.yaml
git commit -m "feat(logger): implement core logger with pino"
```

---

## Chunk 3: Log Store（日志存储）

### Task 3: Create log store for persistence

**Files:**
- Create: `packages/core/src/logger/store.ts`

- [ ] **Step 1: Create log store implementation**

```typescript
import fs from 'node:fs';
import path from 'node:path';
import { ensureDirSync } from 'fs-extra';
import type { LogEntry } from '../types/logger.js';
import { getOpenClawRoot } from '../paths/index.js';

const LOG_DIR = '.clawguard/logs';
const LOG_FILE = 'clawguard.log';
const METADATA_FILE = 'metadata.json';

export class LogStore {
  private logPath: string;
  private metadataPath: string;

  constructor(customRoot?: string) {
    const root = customRoot || getOpenClawRoot();
    this.logPath = path.join(root, LOG_DIR, LOG_FILE);
    this.metadataPath = path.join(root, LOG_DIR, METADATA_FILE);
    ensureDirSync(path.join(root, LOG_DIR));
  }

  /**
   * Append log entry to file
   */
  append(entry: LogEntry): void {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.logPath, line, 'utf8');
    this.updateMetadata(entry);
  }

  /**
   * Read all log entries
   */
  readAll(): LogEntry[] {
    if (!fs.existsSync(this.logPath)) {
      return [];
    }

    const content = fs.readFileSync(this.logPath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);

    return lines.map((line) => {
      try {
        return JSON.parse(line) as LogEntry;
      } catch {
        return null;
      }
    }).filter((entry): entry is LogEntry => entry !== null);
  }

  /**
   * Read log entries with pagination
   */
  readPaginated(offset: number = 0, limit: number = 100): LogEntry[] {
    const all = this.readAll();
    return all.slice(offset, offset + limit);
  }

  /**
   * Filter log entries
   */
  filter(
    predicate: (entry: LogEntry) => boolean
  ): LogEntry[] {
    return this.readAll().filter(predicate);
  }

  /**
   * Clear all logs
   */
  clear(): void {
    if (fs.existsSync(this.logPath)) {
      fs.unlinkSync(this.logPath);
    }
    if (fs.existsSync(this.metadataPath)) {
      fs.unlinkSync(this.metadataPath);
    }
  }

  /**
   * Get log file size
   */
  getSize(): number {
    if (!fs.existsSync(this.logPath)) {
      return 0;
    }
    return fs.statSync(this.logPath).size;
  }

  /**
   * Get metadata
   */
  getMetadata(): { totalLogs: number; lastLogTime?: string } {
    if (!fs.existsSync(this.metadataPath)) {
      return { totalLogs: 0 };
    }

    try {
      const content = fs.readFileSync(this.metadataPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return { totalLogs: 0 };
    }
  }

  private updateMetadata(entry: LogEntry): void {
    const metadata = this.getMetadata();
    metadata.totalLogs += 1;
    metadata.lastLogTime = entry.timestamp;
    fs.writeFileSync(
      this.metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf8'
    );
  }
}

export function createLogStore(customRoot?: string): LogStore {
  return new LogStore(customRoot);
}
```

- [ ] **Step 2: Create log store test**

**Files:**
- Create: `packages/core/src/logger/__tests__/store.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { LogStore, createLogStore } from '../store.js';
import type { LogEntry, LogLevel } from '../../types/logger.js';

describe('LogStore', () => {
  const testDir = path.join(process.cwd(), 'test-logs');
  let store: LogStore;

  beforeEach(() => {
    store = createLogStore(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  const mockEntry = (level: LogLevel, message: string): LogEntry => ({
    timestamp: new Date().toISOString(),
    level,
    message,
    success: true,
  });

  it('should create log directory', () => {
    expect(fs.existsSync(testDir)).toBe(true);
  });

  it('should append log entry', () => {
    const entry = mockEntry('info', 'Test message');
    store.append(entry);

    const logs = store.readAll();
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('Test message');
  });

  it('should read all log entries', () => {
    store.append(mockEntry('info', 'Message 1'));
    store.append(mockEntry('warn', 'Message 2'));

    const logs = store.readAll();
    expect(logs).toHaveLength(2);
  });

  it('should read paginated entries', () => {
    for (let i = 0; i < 5; i++) {
      store.append(mockEntry('info', `Message ${i}`));
    }

    const page1 = store.readPaginated(0, 2);
    expect(page1).toHaveLength(2);

    const page2 = store.readPaginated(2, 2);
    expect(page2).toHaveLength(2);
  });

  it('should filter log entries', () => {
    store.append(mockEntry('info', 'Info message'));
    store.append(mockEntry('error', 'Error message'));
    store.append(mockEntry('warn', 'Warning message'));

    const errors = store.filter((entry) => entry.level === 'error');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Error message');
  });

  it('should clear all logs', () => {
    store.append(mockEntry('info', 'Test'));
    store.clear();

    const logs = store.readAll();
    expect(logs).toHaveLength(0);
  });

  it('should get log file size', () => {
    store.append(mockEntry('info', 'Test'));
    const size = store.getSize();

    expect(size).toBeGreaterThan(0);
  });

  it('should update metadata', () => {
    const entry = { ...mockEntry('info', 'Test'), timestamp: '2024-01-01T00:00:00Z' };
    store.append(entry);

    const metadata = store.getMetadata();
    expect(metadata.totalLogs).toBe(1);
    expect(metadata.lastLogTime).toBe('2024-01-01T00:00:00Z');
  });
});
```

- [ ] **Step 3: Run tests**

```bash
pnpm test:core
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/logger/store.ts packages/core/src/logger/__tests__/store.test.ts
git commit -m "feat(logger): implement log store with file persistence"
```

---

## Chunk 4: Log Query（日志查询）

### Task 4: Create log query interface

**Files:**
- Create: `packages/core/src/logger/query.ts`

- [ ] **Step 1: Create log query implementation**

```typescript
import type { LogEntry, LogQueryOptions, LogStats, LogLevel } from '../types/logger.js';
import { LogStore } from './store.js';

export class LogQuery {
  private store: LogStore;

  constructor(store: LogStore) {
    this.store = store;
  }

  /**
   * Query logs with options
   */
  query(options: LogQueryOptions = {}): LogEntry[] {
    let results = this.store.readAll();

    // Filter by level
    if (options.level) {
      results = results.filter((entry) => entry.level === options.level);
    }

    // Filter by command
    if (options.command) {
      results = results.filter((entry) => entry.command === options.command);
    }

    // Filter by backupId
    if (options.backupId) {
      results = results.filter((entry) => entry.backupId === options.backupId);
    }

    // Filter by scheduleId
    if (options.scheduleId) {
      results = results.filter((entry) => entry.scheduleId === options.scheduleId);
    }

    // Filter by date range
    if (options.startDate) {
      const start = new Date(options.startDate).getTime();
      results = results.filter((entry) => new Date(entry.timestamp).getTime() >= start);
    }

    if (options.endDate) {
      const end = new Date(options.endDate).getTime();
      results = results.filter((entry) => new Date(entry.timestamp).getTime() <= end);
    }

    // Pagination
    if (options.offset) {
      results = results.slice(options.offset);
    }

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get log statistics
   */
  getStats(): LogStats {
    const all = this.store.readAll();

    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    let successCount = 0;

    for (const entry of all) {
      byLevel[entry.level]++;
      if (entry.success) {
        successCount++;
      }
    }

    return {
      total: all.length,
      byLevel,
      successRate: all.length > 0 ? successCount / all.length : 0,
    };
  }

  /**
   * Get recent logs
   */
  recent(count: number = 10): LogEntry[] {
    const all = this.store.readAll();
    return all.slice(-count);
  }

  /**
   * Get failed operations
   */
  failures(): LogEntry[] {
    return this.store.filter((entry) => entry.level === 'error' || !entry.success);
  }

  /**
   * Search logs by message
   */
  search(keyword: string): LogEntry[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.store.filter((entry) =>
      entry.message.toLowerCase().includes(lowerKeyword)
    );
  }
}

export function createLogQuery(store: LogStore): LogQuery {
  return new LogQuery(store);
}
```

- [ ] **Step 2: Create log query test**

**Files:**
- Create: `packages/core/src/logger/__tests__/query.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { LogStore, createLogStore } from '../store.js';
import { LogQuery, createLogQuery } from '../query.js';
import type { LogEntry, LogLevel } from '../../types/logger.js';

describe('LogQuery', () => {
  const testDir = path.join(process.cwd(), 'test-query-logs');
  let store: LogStore;
  let query: LogQuery;

  const mockEntry = (level: LogLevel, message: string, overrides: Partial<LogEntry> = {}): LogEntry => ({
    timestamp: new Date().toISOString(),
    level,
    message,
    success: true,
    ...overrides,
  });

  beforeEach(() => {
    store = createLogStore(testDir);
    query = createLogQuery(store);

    // Add sample logs
    store.append(mockEntry('info', 'Backup started', { command: 'backup' }));
    store.append(mockEntry('warn', 'Disk space low', { command: 'backup' }));
    store.append(mockEntry('error', 'Backup failed', { command: 'backup', success: false }));
    store.append(mockEntry('info', 'Restore started', { command: 'restore' }));
    store.append(mockEntry('info', 'Schedule enabled', { command: 'schedule' }));
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should query all logs', () => {
    const results = query.query();
    expect(results).toHaveLength(5);
  });

  it('should filter by level', () => {
    const results = query.query({ level: 'error' });
    expect(results).toHaveLength(1);
    expect(results[0].message).toBe('Backup failed');
  });

  it('should filter by command', () => {
    const results = query.query({ command: 'backup' });
    expect(results).toHaveLength(3);
  });

  it('should filter by backupId', () => {
    store.append(mockEntry('info', 'Backup completed', { backupId: 'abc123' }));

    const results = query.query({ backupId: 'abc123' });
    expect(results).toHaveLength(1);
  });

  it('should apply pagination', () => {
    const results = query.query({ offset: 1, limit: 2 });
    expect(results).toHaveLength(2);
  });

  it('should get stats', () => {
    const stats = query.getStats();

    expect(stats.total).toBe(5);
    expect(stats.byLevel.info).toBe(3);
    expect(stats.byLevel.warn).toBe(1);
    expect(stats.byLevel.error).toBe(1);
    expect(stats.successRate).toBeCloseTo(0.8);
  });

  it('should get recent logs', () => {
    const recent = query.recent(3);
    expect(recent).toHaveLength(3);
  });

  it('should get failures', () => {
    const failures = query.failures();
    expect(failures).toHaveLength(1);
  });

  it('should search logs by keyword', () => {
    const results = query.search('backup');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((entry) => {
      expect(entry.message.toLowerCase()).toContain('backup');
    });
  });
});
```

- [ ] **Step 3: Run tests**

```bash
pnpm test:core
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/logger/query.ts packages/core/src/logger/__tests__/query.test.ts
git commit -m "feat(logger): implement log query interface"
```

---

## Chunk 5: Logger 导出和集成

### Task 5: Create logger index and update core exports

- [ ] **Step 1: Create logger index**

**Files:**
- Create: `packages/core/src/logger/index.ts`

```typescript
export * from './logger.js';
export * from './store.js';
export * from './query.js';
```

- [ ] **Step 2: Update core index to export logger**

**Files:**
- Modify: `packages/core/src/index.ts`

Add line:
```typescript
// Logger
export * from './logger/index.js';
```

- [ ] **Step 3: Run tests**

```bash
pnpm test:core
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/logger/index.ts packages/core/src/index.ts
git commit -m "feat(logger): export logger module"
``与其他 CLI 命令集成
```

---

## Chunk 6: CLI 集成（logs 命令）

### Task 6: Add logs CLI command

- [ ] **Step 1: Create logs command handler**

**Files:**
- Create: `packages/cli/src/commands/logs.ts`

```typescript
import { logger } from '../utils/logger.js';
import { createLogStore, createLogQuery } from '@core/clawguard';
import type { LogLevel } from '@core/clawguard';

export interface LogsListOptions {
  level?: LogLevel;
  command?: string;
  backupId?: string;
  scheduleId?: string;
  limit?: number;
  offset?: number;
}

export async function listLogsCommand(options: LogsListOptions = {}): Promise<void> {
  try {
    const store = createLogStore();
    const query = createLogQuery(store);

    const logs = query.query({
      level: options.level,
      command: options.command,
      backupId: options.backupId,
      scheduleId: options.scheduleId,
      limit: options.limit,
      offset: options.offset,
    });

    if (logs.length === 0) {
      logger.info('No logs found');
      return;
    }

    logger.info(`Found ${logs.length} log entries:\n`);

    for (const log of logs) {
      const successIcon = log.success ? '✓' : '✗';
      console.log(
        `[${log.timestamp}] [${log.level.toUpperCase()}] ${successIcon} ${log.message}`
      );

      if (log.command) {
        console.log(`  Command: ${log.command}`);
      }
      if (log.backupId) {
        console.log(`  Backup ID: ${log.backupId}`);
      }
      if (log.error) {
        console.log(`  Error: ${log.error}`);
      }
      console.log();
    }
  } catch (error) {
    logger.error('Failed to list logs', error as Error);
    process.exit(1);
  }
}

export async function logsStatsCommand(): Promise<void> {
  try {
    const store = createLogStore();
    const query = createLogQuery(store);

    const stats = query.getStats();
    const metadata = store.getMetadata();

    logger.info('Log Statistics:');
    console.log(`  Total Logs: ${stats.total}`);
    console.log(`  Debug: ${stats.by.byLevel.debug}`);
    console.log(`  Info: ${stats.byLevel.info}`);
    console.log(`  Warn: ${stats.byLevel.warn}`);
    console.log(`  Error: ${stats.byLevel.error}`);
    console.log(`  Success Rate: ${(stats.successRate * 100).toFixed(2)}%`);
    console.log(`  Last Log: ${metadata.lastLogTime || 'N/A'}`);
  } catch (error) {
    logger.error('Failed to get log stats', error as Error);
    process.exit(1);
  }
}

export async function logsClearCommand(): Promise<void> {
  try {
    const store = createLogStore();
    store.clear();
    logger.success('Logs cleared successfully');
  } catch (error) {
    logger.error('Failed to clear logs', error as Error);
    process.exit(1);
  }
}
```

- [ ] **Step 2: Register logs commands in CLI**

**Files:**
- Modify: `packages/cli/src/index.ts`

Add imports:
```typescript
import { listLogsCommand, logsStatsCommand, logsClearCommand } from './commands/logs.js';
```

Add commands:
```typescript
// Logs commands
cli
  .command('logs', 'List operation logs')
  .option('--level <level>', 'Filter by log level (debug, info, warn, error)')
  .option('--command <cmd>', 'Filter by command name')
  .option('--backup-id <id>', 'Filter by backup ID')
  .option('--schedule-id <id>', 'Filter by schedule ID')
  .option('--limit <n>', 'Limit number of results', { default: 100 })
  .option('--offset <n>', 'Offset for pagination', { default: 0 })
  .action(async (options) => {
    await listLogsCommand({
      level: options.level,
      command: options.command,
      backupId: options.backupId,
      scheduleId: options.scheduleId,
      limit: parseInt(options.limit),
      offset: parseInt(options.offset),
    });
  });

cli
  .command('logs stats', 'Show log statistics')
  .action(async () => {
    await logsStatsCommand();
  });

cli
  .command('logs clear', 'Clear all logs')
  .action(async () => {
    await logsClearCommand();
  });
```

- [ ] **Step 3: Create logs command test**

**Files:**
- Create: `packages/cli/src/commands/__tests__/logs.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { listLogsCommand, logsStatsCommand, logsClearCommand } from '../logs.js';

vi.mock('@core/clawguard', () => ({
  createLogStore: vi.fn(() => ({
    append: vi.fn(),
    readAll: vi.fn(() => []),
    filter: vi.fn(() => []),
    clear: vi.fn(),
    getSize: vi.fn(() => 0),
    getMetadata: vi.fn(() => ({ totalLogs: 0 })),
  })),
  createLogQuery: vi.fn(() => ({
    query: vi.fn(() => []),
    getStats: vi.fn(() => ({
      total: 0,
      byLevel: { debug: 0, info: 0, warn: 0, error: 0 },
      successRate: 0,
    })),
  })),
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Logs Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list logs successfully', async () => {
    await expect(listLogsCommand()).resolves.not.toThrow();
  });

  it('should get log stats successfully', async () => {
    await expect(logsStatsCommand()).resolves.not.toThrow();
  });

  it('should clear logs successfully', async () => {
    await expect(logsClearCommand()).resolves.not.toThrow();
  });
});
```

- [ ] **Step 4: Run tests**

```bash
pnpm test:cli
```

Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/commands/logs.ts packages/cli/src/commands/__tests__/logs.test.ts packages/cli/src/index.ts
git commit -m "feat(cli): add logs commands (list, stats, clear)"
```

---

## Final Steps

### Task 7: Update documentation

- [ ] **Step 1: Update TODO.md**

**Files:**
- Modify: `TODO.md`

Mark logging system as completed:
- Update "日志系统" status from ⏳ to ✅
- Update "元数据存储" status from ⏳ to ✅ (already implemented in metadata-store)
- Update "配置管理" status from ⏳ to ✅ (already implemented)

- [ ] **Step 2: Update CLAUDE.md with logs commands**

**Files:**
- Modify: `CLAUDE.md`

Add logs commands section:
```markdown
### Logs 命令
```bash
clawguard logs [--level] [--command] [--backup-id] [--schedule-id] [--limit] [--offset]  # 列出日志
clawguard logs stats              # 查看日志统计
clawguard logs clear              # 清空所有日志
```
```

- [ ] **Step 3: Update package.json with pino**

**Files:**
- Modify: `packages/core/package.json`

Add pino dependencies if not already added.

- [ ] **Step 4: Final commit**

```bash
git add TODO.md CLAUDE.md packages/core/package.json
git commit -m "docs: update documentation for logging system"
```

- [ ] **Step 5: Build and verify**

```bash
pnpm build
pnpm test
```

Expected: All tests pass, build succeeds

---

## Summary

Completed tasks:
1. ✅ Logger types definition
2. ✅ Logger core implementation with pino
3. ✅ Log store with file persistence
4. ✅ Log query interface
5. ✅ Logger module exports
6. ✅ CLI logs commands
7. ✅ Documentation updates
