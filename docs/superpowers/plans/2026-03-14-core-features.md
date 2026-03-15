# Core Features Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement core missing features: Config management, Metadata Store, Restore, and List backup functionality

**Architecture:**
- **Config Module**: Read/write `.clawguard/config.json` for global settings (backup location, retention policy, etc.)
- **Metadata Store**: Manage backup metadata index file for quick queries without scanning all backup files
- **Restore Module**: Extract backup files (JSON for config, tar.gz for system/full) back to OpenClaw directory
- **List Module**: Query metadata store and return sorted backup list
- **CLI Commands**: `clawguard restore`, `clawguard backup list`, `clawguard security set-key`

**Tech Stack:**
- fs/promises, fs-extra for file operations
- tar npm package for tar.gz extraction
- Existing error handling and types
- TypeScript with strict mode

---

## File Structure

```
packages/core/src/
├── config/
│   ├── index.ts          # Config module exports
│   └── config.ts        # Config read/write functions
├── metadata-store/
│   ├── index.ts         # Metadata store exports
│   └── store.ts        # Metadata CRUD operations
├── restore/
│   ├── index.ts         # Restore module exports
│   └── restore.ts      # Restore logic for all levels
└── list/
    ├── index.ts         # List module exports
    └── list.ts         # Backup listing logic

packages/cli/src/
├── commands/
│   ├── restore.ts       # Restore command handler
│   ├── list.ts         # List command handler
│   └── security.ts     # Security commands handler
└── index.ts           # Add new commands
```

---

## Chunk 1: Config Module

### Task 1: Create config.ts - Config file structure and functions

**Files:**
- Create: `packages/core/src/config/config.ts`
- Create: `packages/core/src/types/config.ts` (extend existing)
- Create: `packages/core/src/config/__tests__/config.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/core/src/config/__tests__/config.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getConfig, setConfig, getDefaultConfigPath } from '../config.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const testConfigPath = path.join(os.tmpdir(), 'clawguard-test-config.json');

async function cleanup() {
  try {
    await fs.unlink(testConfigPath);
  } catch {
    // ignore
  }
}

describe('Config Module', () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  it('should return default config when file does not exist', async () => {
    const config = await getConfig(testConfigPath);
    expect(config.backupDir).toBe('.clawguard/backups');
    expect(config.retentionDays).toBe(30);
    expect(config.defaultLevel).toBe('config');
  });

  it('should create default config file when setConfig is called first time', async () => {
    await setConfig({ retentionDays: 7 }, testConfigPath);
    const config = await getConfig(testConfigPath);
    expect(config.retentionDays).toBe(7);
    expect(config.backupDir).toBe('.clawguard/backups');
  });

  it('should update existing config', async () => {
    await setConfig({ retentionDays: 7 }, testConfigPath);
    await setConfig({ defaultLevel: 'system' }, testConfigPath);
    const config = await getConfig(testConfigPath);
    expect(config.retentionDays).toBe(7);
    expect(config.defaultLevel).toBe('system');
  });

  it('should return default config path when not specified', () => {
    const defaultPath = getDefaultConfigPath();
    expect(defaultPath).toContain('.clawguard');
    expect(defaultPath).toContain('config.json');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test:unit config`
Expected: FAIL with "getConfig not defined"

- [ ] **Step 3: Write config.ts implementation**

```typescript
// packages/core/src/config/config.ts
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ValidationError } from '../errors/index.js';
import type { ClawGuardConfig } from '../types/config.js';

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.clawguard');
const DEFAULT_CONFIG_PATH = path.join(DEFAULT_CONFIG_DIR, 'config.json');

export function getDefaultConfigPath(): string {
  return DEFAULT_CONFIG_PATH;
}

export function getDefaultConfig(): ClawGuardConfig {
  return {
    backupDir: '.clawguard/backups',
    retentionDays: 30,
    defaultLevel: 'config',
    encryptionEnabled: false,
  };
}

export async function getConfig(configPath?: string): Promise<ClawGuardConfig> {
  const targetPath = configPath || getDefaultConfigPath();
  const defaultConfig = getDefaultConfig();

  try {
    const content = await fs.readFile(targetPath, 'utf-8');
    const parsed = JSON.parse(content);

    // Validate and merge with defaults
    return {
      backupDir: parsed.backupDir || defaultConfig.backupDir,
      retentionDays: parsed.retentionDays || defaultConfig.retentionDays,
      defaultLevel: parsed.defaultLevel || defaultConfig.defaultLevel,
      encryptionEnabled: parsed.encryptionEnabled || defaultConfig.encryptionEnabled,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Config doesn't exist, return defaults
      return defaultConfig;
    }
    throw new ValidationError(
      `Failed to read config file: ${targetPath}`,
      { error },
    );
  }
}

export async function setConfig(
  updates: Partial<ClawGuardConfig>,
  configPath?: string,
): Promise<ClawGuardConfig> {
  const targetPath = configPath || getDefaultConfigPath();
  const current = await getConfig(targetPath);

  const updated: ClawGuardConfig = {
    ...current,
    ...updates,
  };

  const dir = path.dirname(targetPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(targetPath, JSON.stringify(updated, null, 2), 'utf-8');

  return updated;
}
```

- [ ] **Step 4: Extend types/config.ts**

```typescript
// packages/core/src/types/config.ts (append or create)
export interface ClawGuardConfig {
  backupDir: string;
  retentionDays: number;
  defaultLevel: 'config' | 'system' | 'full';
  encryptionEnabled: boolean;
}
```

- [ ] **Step 5: Create index.ts**

```typescript
// packages/core/src/config/index.ts
export * from './config.js';
```

- [ ] **Step 6: Update core/src/index.ts**

```typescript
// Add to exports
export * from './config/index.js';
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd packages/core && pnpm test:unit config`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/config/
git add packages/core/src/types/config.ts
git add packages/core/src/index.ts
git commit -m "feat: add config management module"
```

---

## Chunk 2: Metadata Store Module

### Task 2: Create store.ts - Metadata persistence

**Files:**
- Create: `packages/core/src/metadata-store/store.ts`
- Create: `packages/core/src/metadata-store/index.ts`
- Create: `packages/core/src/metadata-store/__tests__/store.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/core/src/metadata-store/__tests__/store.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MetadataStore,
  createMetadataStore,
} from '../store.js';
import type { BackupMetadata } from '../../types/backup.js';

describe('Metadata Store', () => {
  let store: MetadataStore;
  const testPath = '/tmp/test-metadata-store.json';

  beforeEach(() => {
    store = createMetadataStore(testPath);
  });

  it('should add and retrieve metadata', async () => {
    const metadata: BackupMetadata = {
      id: '1234567890-abc123',
      name: 'Test Backup',
      level: 'config',
      timestamp: Date.now(),
      size: 1024,
      checksum: 'abc123',
      encrypted: false,
      fileCount: 2,
    };

    await store.add(metadata);
    const retrieved = await store.get('1234567890-abc123');

    expect(retrieved).toEqual(metadata);
  });

  it('should list all backups sorted by timestamp', async () => {
    const now = Date.now();

    await store.add({
      id: '1', name: 'Old', level: 'config', timestamp: now - 1000,
      size: 100, checksum: 'a', encrypted: false, fileCount: 1,
    });

    await store.add({
      id: '2', name: 'New', level: 'system', timestamp: now,
      size: 200, checksum: 'b', encrypted: false, fileCount: 2,
    });

    const list = await store.list();
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe('2'); // Newest first
    expect(list[1].id).toBe('1');
  });

  it('should delete metadata', async () => {
    const metadata: BackupMetadata = {
      id: 'test-id', name: 'Test', level: 'config', timestamp: Date.now(),
      size: 100, checksum: 'x', encrypted: false, fileCount: 1,
    };

    await store.add(metadata);
    await store.delete('test-id');

    const retrieved = await store.get('test-id');
    expect(retrieved).toBeNull();
  });

  it('should filter by level', async () => {
    const now = Date.now();

    await store.add({
      id: '1', name: 'Config', level: 'config', timestamp: now,
      size: 100, checksum: 'a', encrypted: false, fileCount: 1,
    });

    await store.add({
      id: '2', name: 'System', level: 'system', timestamp: now + 1,
      size: 200, checksum: 'b', encrypted: false, fileCount: 2,
    });

    const configBackups = await store.list({ level: 'config' });
    expect(configBackups).toHaveLength(1);
    expect(configBackups[0].level).toBe('config');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test:unit metadata-store`
Expected: FAIL with "createMetadataStore not defined"

- [ ] **Step 3: Write store.ts implementation**

```typescript
// packages/core/src/metadata-store/store.ts
import fs from 'fs/promises';
import path from 'path';
import type { BackupMetadata, BackupLevel } from '../types/backup.js';

export interface MetadataStore {
  add(metadata: BackupMetadata): Promise<void>;
  get(id: string): Promise<BackupMetadata | null>;
  list(options?: { level?: BackupLevel }): Promise<BackupMetadata[]>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

interface MetadataIndex {
  backups: BackupMetadata[];
}

export function createMetadataStore(indexPath: string): MetadataStore {
  const dir = path.dirname(indexPath);

  async function loadIndex(): Promise<MetadataIndex> {
    try {
      const content = await fs.readFile(indexPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { backups: [] };
      }
      throw error;
    }
  }

  async function saveIndex(index: MetadataIndex): Promise<void> {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  }

  return {
    async add(metadata: BackupMetadata): Promise<void> {
      const index = await loadIndex();

      // Remove existing entry with same id (update case)
      index.backups = index.backups.filter(b => b.id !== metadata.id);
      index.backups.push(metadata);

      await saveIndex(index);
    },

    async get(id: string): Promise<BackupMetadata | null> {
      const index = await loadIndex();
      return index.backups.find(b => b.id === id) || null;
    },

    async list(options?: { level?: BackupLevel }): Promise<BackupMetadata[]> {
      const index = await loadIndex();
      let result = [...index.backups];

      // Sort by timestamp descending (newest first)
      result.sort((a, b) => b.timestamp - a.timestamp);

      // Filter by level if specified
      if (options?.level) {
        result = result.filter(b => b.level === options.level);
      }

      return result;
    },

    async delete(id: string): Promise<void> {
      const index = await loadIndex();
      index.backups = index.backups.filter(b => b.id !== id);
      await saveIndex(index);
    },

    async clear(): Promise<void> {
      await saveIndex({ backups: [] });
    },
  };
}

export function getDefaultMetadataIndexPath(backupDir: string): string {
  return path.join(backupDir, 'metadata-index.json');
}
```

- [ ] **Step 4: Create index.ts**

```typescript
// packages/core/src/metadata-store/index.ts
export * from './store.js';
```

- [ ] **Step 5: Update core/src/index.ts**

```typescript
// Add to exports
export * from './metadata-store/index.js';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/core && pnpm test:unit metadata-store`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/metadata-store/
git add packages/core/src/index.ts
git commit -m "feat: add metadata store module"
```

---

## Chunk 3: Restore Module

### Task 3: Create restore.ts - Restore functionality

**Files:**
- Create: `packages/core/src/restore/restore.ts`
- Create: `packages/core/src/restore/index.ts`
- Create: `packages/core/src/restore/__tests__/restore.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/core/src/restore/__tests__/restore.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { restore } from '../restore.js';
import { backup } from '../../backup/index.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Restore Module', () => {
  const testDir = path.join(os.tmpdir(), 'clawguard-test-restore');
  const openclawRoot = path.join(testDir, '.openclaw');
  const backupDir = path.join(testDir, '.clawguard', 'backups');

  beforeEach(async () => {
    // Setup test directories
    await fs.mkdir(openclawRoot, { recursive: true });
    await fs.mkdir(backupDir, { recursive: true });

    // Create test config file
    await fs.writeFile(
      path.join(openclawRoot, 'config.json'),
      JSON.stringify({ test: 'original' }),
    );
  });

  afterEach(async () => {
    // Cleanup
    const fsExtra = await import('fs-extra');
    await fsExtra.remove(testDir);
  });

  it('should restore level-1 backup (config files)', async () => {
    // Create a backup
    const backupResult = await backup({
      level: 'config',
      output: backupDir,
    });

    // Modify original config
    await fs.writeFile(
      path.join(openclawRoot, 'config.json'),
      JSON.stringify({ test: 'modified' }),
    );

    // Restore
    await restore(backupResult.metadata.id, {
      backupDir,
      openclawRoot,
    });

    // Verify restored content
    const content = await fs.readFile(
      path.join(openclawRoot, 'config.json'),
      'utf-8',
    );
    const parsed = JSON.parse(content);
    expect(parsed.test).toBe('original');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test:unit restore`
Expected: FAIL with "restore not defined"

- [ ] **Step 3: Write restore.ts implementation**

```typescript
// packages/core/src/restore/restore.ts
import fs from 'fs/promises';
import fsExtra from 'fs-extra';
import path from 'path';
import { getOpenClawRoot } from '../paths/index.js';
import { createMetadataStore, getDefaultMetadataIndexPath } from '../metadata-store/index.js';
import { FileNotFoundError, RestoreError } from '../errors/index.js';
import { calculateChecksum } from '../backup/metadata.js';
import type { BackupMetadata } from '../types/backup.js';

export interface RestoreOptions {
  backupDir?: string;
  openclawRoot?: string;
  dryRun?: boolean;
}

export async function restore(
  backupId: string,
  options: RestoreOptions = {},
): Promise<BackupMetadata> {
  const backupDir = options.backupDir || '.clawguard/backups';
  const openclawRoot = options.openclawRoot || getOpenClawRoot();
  const metadataStore = createMetadataStore(
    getDefaultMetadataIndexPath(backupDir),
  );

  // Get metadata
  const metadata = await metadataStore.get(backupId);
  if (!metadata) {
    throw new FileNotFoundError(`Backup not found: ${backupId}`);
  }

  // Determine backup file path
  const ext = metadata.level === 'config' ? '.json' : '.tar.gz';
  const backupPath = path.join(backupDir, `${backupId}${ext}`);

  // Verify backup file exists
  try {
    await fs.access(backupPath);
  } catch {
    throw new FileNotFoundError(`Backup file not found: ${backupPath}`);
  }

  // Read backup data
  const data = await fs.readFile(backupPath);

  // Verify checksum
  const actualChecksum = calculateChecksum(data);
  if (actualChecksum !== metadata.checksum) {
    throw new RestoreError(
      'Backup checksum mismatch. File may be corrupted.',
      { expected: metadata.checksum, actual: actualChecksum },
    );
  }

  if (options.dryRun) {
    // Dry run - just return metadata
    return metadata;
  }

  // Restore based on level
  if (metadata.level === 'config') {
    await restoreConfigBackup(data, openclawRoot);
  } else if (metadata.level === 'system') {
    await restoreTarBackup(data, openclawRoot);
  } else if (metadata.level === 'full') {
    await restoreTarBackup(data, path.join(openclawRoot, 'workspace'));
  }

  return metadata;
}

async function restoreConfigBackup(data: Buffer, targetPath: string): Promise<void> {
  const parsed = JSON.parse(data.toString('utf-8')) as Record<string, string>;

  for (const [filePath, content] of Object.entries(parsed)) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }
}

async function restoreTarBackup(data: Buffer, targetPath: string): Promise<void> {
  // Ensure target directory exists
  await fs.mkdir(targetPath, { recursive: true });

  // Create a temporary file for the tar.gz
  const tempFile = path.join(process.cwd(), 'temp-restore.tar.gz');
  await fs.writeFile(tempFile, data);

  try {
    const tar = await import('tar');
    await tar.extract({
      file: tempFile,
      cwd: targetPath,
    });
  } finally {
    await fs.unlink(tempFile);
  }
}
```

- [ ] **Step 4: Create index.ts**

```typescript
// packages/core/src/restore/index.ts
export * from './restore.js';
```

- [ ] **Step 5: Update core/src/index.ts**

```typescript
// Add to exports
export * from './restore/index.js';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/core && pnpm test:unit restore`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/restore/
git add packages/core/src/index.ts
git commit -m "feat: add restore module"
```

---

## Chunk 4: List Module

### Task 4: Create list.ts - Backup listing

**Files:**
- Create: `packages/core/src/list/list.ts`
- Create: `packages/core/src/list/index.ts`
- Create: `packages/core/src/list/__tests__/list.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/core/src/list/__tests__/list.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { listBackups } from '../list.js';
import { backup } from '../../backup/index.js';
import { createMetadataStore, getDefaultMetadataIndexPath } from '../../metadata-store/index.js';
import fsExtra from 'fs-extra';
import path from 'path';
import os from 'os';

describe('List Module', () => {
  const testDir = path.join(os.tmpdir(), 'clawguard-test-list');
  const backupDir = path.join(testDir, 'backups');

  beforeEach(async () => {
    await fsExtra.ensureDir(backupDir);
    const store = createMetadataStore(getDefaultMetadataIndexPath(backupDir));
    await store.clear();
  });

  it('should list all backups', async () => {
    // Create test backups
    await backup({ level: 'config', output: backupDir });
    await backup({ level: 'system', output: backupDir });

    const list = await listBackups({ backupDir });
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it('should filter by level', async () => {
    await backup({ level: 'config', output: backupDir });
    await backup({ level: 'system', output: backupDir });

    const configBackups = await listBackups({
      backupDir,
      level: 'config',
    });
    expect(configBackups.every(b => b.level === 'config')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test:unit list`
Expected: FAIL with "listBackups not defined"

- [ ] **Step 3: Write list.ts implementation**

```typescript
// packages/core/src/list/list.ts
import { createMetadataStore, getDefaultMetadataIndexPath } from '../metadata-store/index.js';
import type { BackupMetadata, BackupLevel } from '../types/backup.js';

export interface ListOptions {
  backupDir?: string;
  level?: BackupLevel;
}

export async function listBackups(
  options: ListOptions = {},
): Promise<BackupMetadata[]> {
  const backupDir = options.backupDir || '.clawguard/backups';
  const metadataStore = createMetadataStore(
    getDefaultMetadataIndexPath(backupDir),
  );

  return metadataStore.list({ level: options.level });
}
```

- [ ] **Step 4: Create index.ts**

```typescript
// packages/core/src/list/index.ts
export * from './list.js';
```

- [ ] **Step 5: Update core/src/index.ts**

```typescript
// Add to exports
export * from './list/index.js';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/core && pnpm test:unit list`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/list/
git add packages/core/src/index.ts
git commit -m "feat: add list module"
```

---

## Chunk 5: Update Backup to Use Metadata Store

### Task 5: Modify backup/index.ts to integrate metadata store

**Files:**
- Modify: `packages/core/src/backup/index.ts`

- [ ] **Step 1: Write test for metadata storage on backup**

```typescript
// packages/core/src/backup/__tests__/integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { backup } from '../index.js';
import { createMetadataStore, getDefaultMetadataIndexPath } from '../../metadata-store/index.js';
import fsExtra from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Backup Integration with Metadata Store', () => {
  const testDir = path.join(os.tmpdir(), 'clawguard-backup-integration');
  const backupDir = path.join(testDir, 'backups');

  beforeEach(async () => {
    await fsExtra.ensureDir(backupDir);
    const store = createMetadataStore(getDefaultMetadataIndexPath(backupDir));
    await store.clear();
  });

  it('should store metadata in metadata store after backup', async () => {
    const result = await backup({
      level: 'config',
      output: backupDir,
    });

    const store = createMetadataStore(getDefaultMetadataIndexPath(backupDir));
    const metadata = await store.get(result.metadata.id);

    expect(metadata).not.toBeNull();
    expect(metadata?.id).toBe(result.metadata.id);
    expect(metadata?.level).toBe('config');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test:unit backup integration`
Expected: FAIL (metadata not stored)

- [ ] **Step 3: Update backup/index.ts**

```typescript
// packages/core/src/backup/index.ts
import { backupLevel1 } from './level-1.js';
import { backupLevel2 } from './level-2.js';
import { backupLevel3 } from './level-3.js';
import { createMetadataStore, getDefaultMetadataIndexPath } from '../metadata-store/index.js';
import type { BackupOptions, BackupInfo } from '../types/backup.js';

export async function backup(
  options: BackupOptions,
): Promise<BackupInfo> {
  const backupDir = options.output || '.clawguard/backups';
  const metadataStore = createMetadataStore(getDefaultMetadataIndexPath(backupDir));

  let result: BackupInfo;

  switch (options.level) {
    case 'config':
      result = await backupLevel1(options);
      break;
    case 'system':
      result = await backupLevel2(options);
      break;
    case 'full':
      result = await backupLevel3(options);
      break;
    default:
      throw new Error(`Invalid backup level: ${options.level}`);
  }

  // Store metadata in metadata store
  await metadataStore.add(result.metadata);

  return result;
}

export * from './metadata.js';
export * from './level-1.js';
export * from './level-2.js';
export * from './level-3.js';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && pnpm test:unit backup integration`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/backup/index.ts
git add packages/core/src/backup/__tests__/integration.test.ts
git commit -m "feat: integrate metadata store with backup"
```

---

## Chunk 6: CLI Commands

### Task 6: Add restore command

**Files:**
- Create: `packages/cli/src/commands/restore.ts`
- Modify: `packages/cli/src/index.ts`

- [ ] **Step 1: Create restore.ts**

```typescript
// packages/cli/src/commands/restore.ts
import { restore } from '@core/clawguard';
import type { RestoreOptions } from '@core/clawguard';
import { createSpinner } from '../utils/spinner.js';
import { logger } from '../utils/logger.js';

export async function restoreCommand(
  backupId: string,
  options: RestoreOptions,
): Promise<void> {
  const spinner = createSpinner('Restoring backup...').start();

  try {
    const metadata = await restore(backupId, options);

    if (options.dryRun) {
      spinner.succeed('Dry run completed - no changes made');
    } else {
      spinner.succeed('Backup restored successfully!');
    }

    logger.info('ID: ' + metadata.id);
    logger.info('Name: ' + metadata.name);
    logger.info('Level: ' + metadata.level);
    logger.info('Timestamp: ' + new Date(metadata.timestamp).toLocaleString());
  } catch (error) {
    spinner.fail('Restore failed!');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
```

- [ ] **Step 2: Add restore command to index.ts**

```typescript
// Add to packages/cli/src/index.ts
import { restoreCommand } from './commands/restore.js';

cli
  .command('restore <backupId>')
  .option('--dry-run', 'Preview changes without restoring')
  .action(async (backupId, options) => {
    await restoreCommand(backupId, {
      dryRun: options.dryRun,
    });
  });
```

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/commands/restore.ts
git add packages/cli/src/index.ts
git commit -m "feat: add restore CLI command"
```

---

### Task 7: Add list command

**Files:**
- Create: `packages/cli/src/commands/list.ts`
- Modify: `packages/cli/src/index.ts`

- [ ] **Step 1: Create list.ts**

```typescript
// packages/cli/src/commands/list.ts
import { listBackups } from '@core/clawguard';
import type { ListOptions } from '@core/clawguard';
import { logger } from '../utils/logger.js';
import type { BackupMetadata } from '@core/clawguard';

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export async function listCommand(options: ListOptions): Promise<void> {
  try {
    const backups = await listBackups(options);

    if (backups.length === 0) {
      logger.info('No backups found.');
      return;
    }

    logger.info(`Found ${backups.length} backup(s):\n`);

    backups.forEach((backup: BackupMetadata, index: number) => {
      logger.info(`${index + 1}. ${backup.name}`);
      logger.info(`   ID: ${backup.id}`);
      logger.info(`   Level: ${backup.level}`);
      logger.info(`   Size: ${formatSize(backup.size)}`);
      logger.info(`   Files: ${backup.fileCount}`);
      logger.info(`   Created: ${new Date(backup.timestamp).toLocaleString()}`);
      if (backup.encrypted) logger.info(`   Encrypted: Yes`);
      logger.info('');
    });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
```

- [ ] **Step 2: Add list command to index.ts**

```typescript
// Add to packages/cli/src/index.ts
import { listCommand } from './commands/list.js';

cli
  .command('backup list')
  .option('--level <level>', 'Filter by level: config, system, or full')
  .action(async (options) => {
    await listCommand({
      level: options.level,
    });
  });
```

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/commands/list.ts
git add packages/cli/src/index.ts
git commit -m "feat: add list CLI command"
```

---

### Task 8: Add security commands

**Files:**
- Create: `packages/cli/src/commands/security.ts`
- Modify: `packages/cli/src/index.ts`

- [ ] **Step 1: Create security.ts**

```typescript
// packages/cli/src/commands/security.ts
import { setKey, generateKey } from '@core/clawguard';
import { createSpinner } from '../utils/spinner.js';
import { logger } from '../utils/logger.js';

export async function setKeyCommand(password?: string): Promise<void> {
  try {
    if (!password) {
      // Generate a random key
      const spinner = createSpinner('Generating encryption key...').start();
      const key = await generateKey();
      spinner.succeed('Key generated!');

      logger.info('Your encryption key:');
      logger.info(key);
      logger.info('\nStore this key securely. You will need it to decrypt backups.');
      logger.info('To use this key, run: clawguard security set-key <your-key>');

      return;
    }

    const spinner = createSpinner('Setting encryption key...').start();
    await setKey(password);
    spinner.succeed('Encryption key set successfully!');
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
```

- [ ] **Step 2: Add security command to index.ts**

```typescript
// Add to packages/cli/src/index.ts
import { setKeyCommand } from './commands/security.js';

cli
  .command('security set-key [password]')
  .description('Set or generate encryption key (omit password to generate)')
  .action(async (password) => {
    await setKeyCommand(password);
  });
```

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/commands/security.ts
git add packages/cli/src/index.ts
git commit -m "feat: add security CLI commands"
```

---

## Final: Build and Test

### Task 9: Verify everything works

**Files:**
- None

- [ ] **Step 1: Build packages**

```bash
pnpm build
```

- [ ] **Step 2: Run all tests**

```bash
pnpm test
```

- [ ] **Step 3: Test CLI commands**

```bash
# Set encryption key
clawguard security set-key

# Create backup
clawguard backup --level config --name "Test Backup"

# List backups
clawguard backup list

# Restore backup (use ID from list)
clawguard restore <backup-id>
```

- [ ] **Step 4: Update TODO.md**

Mark completed items in TODO.md

- [ ] **Step 5: Commit final changes**

```bash
git add TODO.md
git commit -m "docs: update TODO with completed core features"
```

---

**Plan complete and saved to `docs/superpowers/plans/2026-03-14-core-features.md`. Ready to execute?**
