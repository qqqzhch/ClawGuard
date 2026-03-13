# ClawGuard v1.0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build ClawGuard - OpenClaw configuration management tool with CLI and Web UI

**Architecture:** Monorepo with shared core package. CLI and Web UI both depend on @core/clawguard. Web UI static resources bundled into CLI package for npm distribution.

**Tech Stack:** Node.js 22, TypeScript, pnpm (workspace), CAC (CLI), Hono (Web backend), React + Vite (Web frontend), Vitest (tests), Playwright (E2E)

---

## Phase 1: Project Initialization

### Task 1: Create root package.json and pnpm workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.json`

**Step 1: Write package.json**

```json
{
  "name": "clawguard",
  "version": "1.0.0",
  "private": true,
  "description": "OpenClaw configuration management tool",
  "type": "module",
  "scripts": {
    "dev": "pnpm --filter @web/clawguard dev",
    "build": "node scripts/build.js",
    "build:cli": "pnpm --filter @cli/clawguard build",
    "test": "vitest",
    "test:cli": "vitest --filter=@cli/clawguard",
    "test:core": "vitest --filter=@core/clawguard",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.4.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0",
    "vitest": "^1.5.0",
    "playwright": "^1.42.0",
    "tsup": "^8.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

**Step 2: Write pnpm-workspace.yaml**

```yaml
packages:
  - packages/*
```

**Step 3: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "experimentalStripTypes": true
  }
}
```

**Step 4: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.json
git commit -m "feat: initialize root workspace"
```

---

### Task 2: Create build script

**Files:**
- Create: `scripts/build.js`

**Step 1: Write build script**

```javascript
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

console.log('Building ClawGuard...');

// 1. Build core
console.log('Building @core/clawguard...');
execSync('pnpm --filter @core/clawguard build', { stdio: 'inherit' });

// 2. Build CLI
console.log('Building @cli/clawguard...');
execSync('pnpm --filter @cli/clawguard build', { stdio: 'inherit' });

// 3. Build Web UI client
console.log('Building Web UI client...');
execSync('pnpm --filter @web/clawguard build:client', { stdio: 'inherit' });

// 4. Copy Web UI static assets to CLI
console.log('Copying Web UI assets to CLI...');
const webDist = path.resolve('packages/web/client/dist');
const cliPublic = path.resolve('packages/cli/public');
fs.copySync(webDist, cliPublic, { overwrite: true });

// 5. Copy Web API server to CLI
console.log('Copying Web API server to CLI...');
const webServerSrc = path.resolve('packages/web/server/src');
const cliServerSrc = path.resolve('packages/cli/src/server');
fs.copySync(webServerSrc, cliServerSrc, { overwrite: true });

console.log('Build complete!');
```

**Step 2: Commit**

```bash
git add scripts/build.js
git commit -m "feat: add build script"
```

---

## Phase 2: Core Package (@core/clawguard)

### Task 3: Create core package structure

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`

**Step 1: Write core/package.json**

```json
{
  "name": "@core/clawguard",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --experimentalStripTypes",
    "dev": "tsup src/index.ts --format esm --dts --watch --experimentalStripTypes",
    "test": "vitest"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "vitest": "^1.5.0"
  },
  "dependencies": {
    "tar": "^6.2.0",
    "zlib": "^1.0.5"
  }
}
```

**Step 2: Write core/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Commit**

```bash
git add packages/core/package.json packages/core/tsconfig.json
git commit -m "feat: create core package structure"
```

---

### Task 4: Define types

**Files:**
- Create: `packages/core/src/types/backup.ts`
- Create: `packages/core/src/types/config.ts`
- Create: `packages/core/src/types/scheduler.ts`
- Create: `packages/core/src/types/index.ts`

**Step 1: Write backup types**

```typescript
export type BackupLevel = 'config' | 'system' | 'full';

export interface BackupOptions {
  level: BackupLevel;
  name?: string;
  output?: string;
  encrypt?: boolean;
}

export interface BackupMetadata {
  id: string;
  name: string;
  level: BackupLevel;
  timestamp: number;
  size: number;
  checksum: string;
  encrypted: boolean;
  fileCount: number;
}

export interface BackupInfo {
  metadata: BackupMetadata;
  filePath: string;
}
```

**Step 2: Write config types**

```typescript
export interface ClawGuardConfig {
  backupDir: string;
  encryptionKey?: string;
  retainDays: number;
  autoBackupEnabled: boolean;
  autoBackupCron: string;
}

export interface OpenClawPaths {
  root: string;
  workspace: string;
  configFiles: string[];
  systemFiles: {
    soul: string;
    user: string;
    memory: string;
    memoryDir: string;
    subagents: string;
    heartbeat: string;
    tools: string;
    agents: string;
  };
}
```

**Step 3: Write scheduler types**

```typescript
export interface ScheduleOptions {
  cron: string;
  retainDays: number;
  enabled: boolean;
}

export interface ScheduleTask {
  id: string;
  name: string;
  cron: string;
  lastRun: number | null;
  nextRun: number;
  enabled: boolean;
}
```

**Step 4: Write types index**

```typescript
export * from './backup.js';
export * from './config.js';
export * from './scheduler.js';
```

**Step 5: Commit**

```bash
git add packages/core/src/types
git commit -m "feat: define core types"
```

---

### Task 5: Define error types

**Files:**
- Create: `packages/core/src/errors/codes.ts`
- Create: `packages/core/src/errors/types.ts`
- Create: `packages/core/src/errors/index.ts`

**Step 1: Write error codes**

```typescript
export const ErrorCodes = {
  BACKUP_FAILED: 'BACKUP_FAILED',
  RESTORE_FAILED: 'RESTORE_FAILED',
  EXPORT_FAILED: 'EXPORT_FAILED',
  IMPORT_FAILED: 'IMPORT_FAILED',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INVALID_CONFIG: 'INVALID_CONFIG',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

**Step 2: Write error types**

```typescript
import type { ErrorCode } from './codes.js';

export class ClawGuardError extends Error {
  code: ErrorCode;
  httpStatus: number;
  details?: unknown;

  constructor(
    message: string,
    code: ErrorCode = 'UNKNOWN_ERROR',
    httpStatus = 500,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ClawGuardError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

export class BackupError extends ClawGuardError {
  constructor(message: string, details?: unknown) {
    super(message, 'BACKUP_FAILED', 500, details);
    this.name = 'BackupError';
  }
}

export class RestoreError extends ClawGuardError {
  constructor(message: string, details?: unknown) {
    super(message, 'RESTORE_FAILED', 500, details);
    this.name = 'RestoreError';
  }
}

export class FileNotFoundError extends ClawGuardError {
  constructor(path: string) {
    super(`File not found: ${path}`, 'FILE_NOT_FOUND', 404);
    this.name = 'FileNotFoundError';
  }
}

export class PermissionError extends ClawGuardError {
  constructor(message: string) {
    super(message, 'PERMISSION_DENIED', 403);
    this.name = 'PermissionError';
  }
}

export class ValidationError extends ClawGuardError {
  constructor(message: string, details?: unknown) {
    super(message, 'INVALID_CONFIG', 400, details);
    this.name = 'ValidationError';
  }
}

export class EncryptionError extends ClawGuardError {
  constructor(message: string) {
    super(message, 'ENCRYPTION_FAILED', 500);
    this.name = 'EncryptionError';
  }
}

export class DecryptionError extends ClawGuardError {
  constructor(message: string) {
    super(message, 'DECRYPTION_FAILED', 500);
    this.name = 'DecryptionError';
  }
}
```

**Step 3: Write errors index**

```typescript
export * from './codes.js';
export * from './types.js';
```

**Step 4: Commit**

```bash
git add packages/core/src/errors
git commit -m "feat: define error types"
```

---

### Task 6: Create path management module

**Files:**
- Create: `packages/core/src/paths/openclaw-root.ts`
- Create: `packages/core/src/paths/config-files.ts`
- Create: `packages/core/src/paths/system-files.ts`
- Create: `packages/core/src/paths/workspace.ts`
- Create: `packages/core/src/paths/index.ts`
- Create: `packages/core/src/paths/__tests__/index.test.ts`

**Step 1: Write openclaw-root.ts**

```typescript
import path from 'path';
import os from 'os';

export function getOpenClawRoot(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, '.openclaw');
}

export function ensureOpenClawDir(): string {
  const root = getOpenClawRoot();
  const fs = await import('fs-extra');
  await fs.ensureDir(root);
  return root;
}
```

**Step 2: Write config-files.ts**

```typescript
import path from 'path';
import { getOpenClawRoot } from './openclaw-root.js';

export function getConfigFiles(): string[] {
  const root = getOpenClawRoot();
  return [
    path.join(root, 'config.json'),
    path.join(root, 'settings.json'),
  ];
}
```

**Step 3: Write system-files.ts**

```typescript
import path from 'servertest';
import { getOpenClawRoot } from './openclaw-root.js';

export function getSystemFilePaths() {
  const root = getOpenClawRoot();
  return {
    soul: path.join(root, 'SOUL.md'),
    user: path.join(root, 'USER.md'),
    memory: path.join(root, 'MEMORY.md'),
    memoryDir: path.join(root, 'memory'),
    subagents: path.join(root, 'SUBAGENTS.md'),
    heartbeat: path.join(root, 'HEARTBEAT.md'),
    tools: path.join(root, 'TOOLS.md'),
    agents: path.join(root, 'AGENTS.md'),
  };
}
```

**Step 4: Write workspace.ts**

```typescript
import path from 'path';
import { getOpenClawRoot } from './openclaw-root.js';

export function getWorkspacePath(): string {
  return path.join(getOpenClawRoot(), 'workspace');
}

export async function ensureWorkspaceDir(): Promise<string> {
  const workspace = getWorkspacePath();
  const fs = await import('fs-extra');
  await fs.ensureDir(workspace);
  return workspace;
}
```

**Step 5: Write paths index**

```typescript
export * from './openclaw-root.js';
export * from './config-files.js';
export * from './system-files.js';
export * from './workspace.js';

import type { OpenClawPaths } from '../types/config.js';
import { getOpenClawRoot } from './openclaw-root.js';
import { getConfigFiles } from './config-files.js';
import { getSystemFilePaths } from './system-files.js';
import { getWorkspacePath } from './workspace.js';

export function getOpenClawPaths(): OpenClawPaths {
  return {
    root: getOpenClawRoot(),
    workspace: getWorkspacePath(),
    configFiles: getConfigFiles(),
    systemFiles: getSystemFilePaths(),
  };
}
```

**Step 6: Write path test**

```typescript
import { describe, it, expect } from 'vitest';
import { getOpenClawRoot, getWorkspacePath, getSystemFilePaths } from '../index.js';

describe('Paths', () => {
  it('should return .openclaw root path', () => {
    const root = getOpenClawRoot();
    expect(root).toContain('.openclaw');
  });

  it('should return workspace path', () => {
    const workspace = getWorkspacePath();
    expect(workspace).toContain('workspace');
  });

  it('should return system file paths', () => {
    const paths = getSystemFilePaths();
    expect(paths.soul).toContain('SOUL.md');
    expect(paths.memory).toContain('MEMORY.md');
  });
});
```

**Step 7: Run test**

```bash
cd packages/core && pnpm test
```

Expected: PASS

**Step 8: Commit**

```bash
git add packages/core/src/paths
git commit -m "feat: add path management module"
```

---

### Task 7: Create encryption module

**Files:**
- Create: `packages/core/src/encryption/encrypt.ts`
- Create: `packages/core/src/encryption/decrypt.ts`
- Create: `packages/core/src/encryption/key-manager.ts`
- Create: `packages/core/src/encryption/index.ts`
- Create: `packages/core/src/encryption/__tests__/index.test.ts`

**Step 1: Write encrypt.ts**

```typescript
import crypto from 'crypto';

export interface EncryptResult {
  data: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

export async function encrypt(data: Buffer, key: Buffer): Promise<EncryptResult> {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final(),
  ]);

  return {
    data: encrypted,
    iv,
    authTag: cipher.getAuthTag(),
  };
}
```

**Step 2: Write decrypt.ts**

```typescript
import crypto from 'crypto';
import type { EncryptResult } from './encrypt.js';

export async function decrypt(
  result: EncryptResult,
  key: Buffer,
): Promise<Buffer> {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, result.iv);
  decipher.setAuthTag(result.authTag);

  return Buffer.concat([
    decipher.update(result.data),
    decipher.final(),
  ]);
}
```

**Step 3: Write key-manager.ts**

```typescript
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EncryptionError } from '../errors/index.js';

const KEY_PATH = path.join(os.homedir(), '.clawguard', 'encryption.key');

export async function getKey(): Promise<Buffer | null> {
  try {
    const keyHex = await fs.readFile(KEY_PATH, 'utf-8');
    return Buffer.from(keyHex, 'hex');
  } catch {
    return null;
  }
}

export async function setKey(key: string): Promise<void> {
  if (key.length < 32) {
    throw new EncryptionError('Key must be at least 32 characters');
  }

  const keyBuffer = crypto.createHash('sha256').update(key).digest();

  const keyDir = path.dirname(KEY_PATH);
  await fs.mkdir(keyDir, { recursive: true });

  await fs.writeFile(KEY_PATH, keyBuffer.toString('hex'), 'utf-8');
}

export async function generateKey(): Promise<string> {
  return crypto.randomBytes(32).toString('hex');
}
```

**Step 4: Write encryption index**

```typescript
export * from './encrypt.js';
export * from './decrypt.js';
export * from './key-manager.js';
```

**Step 5: Write encryption test**

```typescript
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, getKey, setKey, generateKey } from '../index.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Encryption', () => {
  it('should encrypt and decrypt data', async () => {
    const data = Buffer.from('Hello, World!');
    const key = Buffer.from('012345678901234567890123456789012');

    const result = await encrypt(data, key);
    const decrypted = await decrypt(result, key);

    expect(decrypted.toString()).toBe('Hello, World!');
  });

  it('should generate and store key', async () => {
    const key = await generateKey();
    await setKey(key);

    const storedKey = await getKey();
    expect(storedKey).not.toBeNull();
    expect(storedKey!.toString('hex')).toBe(
      Buffer.from(key, 'hex').toString('hex'),
    );

    // Cleanup
    const keyPath = path.join(os.homedir(), '.clawguard', 'encryption.key');
    await fs.unlink(keyPath).catch(() => {});
  });
});
```

**Step 6: Run test**

```bash
cd packages/core && pnpm test
```

Expected: PASS

**Step 7: Commit**

```bash
git add packages/core/src/encryption
git commit -m "feat: add encryption module"
```

---

### Task 8: Create backup module

**Files:**
- Create: `packages/core/src/backup/metadata.ts`
- Create: `packages/core/src/backup/level-1.ts`
- Create: `packages/core/src/backup/level-2.ts`
- Create: `packages/core/src/backup/level-3.ts`
- Create: `packages/core/src/backup/index.ts`
- Create: `packages/core/src/backup/__tests__/level-1.test.ts`

**Step 1: Write backup metadata**

```typescript
import crypto from 'crypto';
import type { BackupMetadataInfo } from '../types/backup.js';
import type { BackupLevel } from '../types/backup.js';

export function generateBackupId(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `${timestamp}-${random}`;
}

export function createBackupMetadata(
  id: string,
  name: string,
  level: BackupLevel,
  size: number,
  fileCount: number,
  encrypted: boolean,
): BackupMetadata {
  const data = Buffer.from(JSON.stringify({ id, name, level, size, fileCount, encrypted }));
  const checksum = crypto.createHash('sha256').update(data).digest('hex');

  return {
    id,
    name,
    level,
    timestamp: Date.now(),
    size,
    checksum,
    encrypted,
    fileCount,
  };
}

export function calculateChecksum(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
```

**Step 2: Write level-1 backup**

```typescript
import fs from 'fs/promises';
import path from 'path';
import { getConfigFiles } from '../paths/index.js';
import { createBackupMetadata, generateBackupId, calculateChecksum } from './metadata.js';
import type { BackupLevel } from '../types/backup.js';
import type { BackupOptions, BackupInfo } from '../types/backup.js';

export async function backupLevel1(options: BackupOptions): Promise<BackupInfo> {
  const id = generateBackupId();
  const name = options.name || `Backup ${new Date().toLocaleString()}`;

  // Get config files
  const files = getConfigFiles();

  // Create backup data as JSON
  const backupData: Record<string, unknown> = {};
  let fileCount = 0;

  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      backupData[filePath] = content;
      fileCount++;
    } catch {
      // File doesn't exist, skip
    }
  }

  const data = Buffer.from(JSON.stringify(backupData));
  const checksum = calculateChecksum(data);

  // Determine output path
  const output = options.output || path.join(process.cwd(), '.clawguard', 'backups');
  await fs.mkdir(output, { recursive: true });

  const filePath = path.join(output, `${id}.json`);
  await fs.writeFile(filePath, data);

  const metadata = createBackupMetadata(id, name, 'config', data.length, fileCount, false);

  return {
    metadata,
    filePath,
  };
}
```

**Step 3: Write level-2 backup**

```typescript
import fs from 'fs/promises';
import path from 'path';
import tar from 'tar';
import { getConfigFiles } from '../paths/index.js';
import { getSystemFilePaths } from '../paths/index.js';
import { createBackupMetadata, generateBackupId, calculateChecksum } from './metadata.js';
import type { BackupOptions, BackupInfo } from '../types/backup.js';

export async function backupLevel2(options: BackupOptions): Promise<BackupInfo> {
  const id = generateBackupId();
  const name = options.name || `System Backup ${new Date().toLocaleString()}`;

  // Get files to backup
  const files = [...getConfigFiles(), ...Object.values(getSystemFilePaths())];

  // Create tar.gz
  const tarPath = path.join(process.cwd(), 'temp-backup.tar');

  await tar.create(
    {
      gzip: true,
      file: tarPath,
      cwd: path.join(require('os').homedir(), '.openclaw'),
    },
    files.map(f => path.basename(f)),
  );

  const data = await fs.readFile(tarPath);
  const checksum = calculateChecksum(data);

  // Cleanup temp
  await fs.unlink(tarPath);

  // Determine output path
  const output = options.output || path.join(process.cwd(), '.clawguard', 'backups');
  await fs.mkdir(output, { recursive: true });

  const filePath = path.join(output, `${id}.tar.gz`);
  await fs.writeFile(filePath, data);

  const metadata = createBackupMetadata(id, name, 'system', data.length, files.length, false);

  return {
    metadata,
    filePath,
  };
}
```

**Step 4: Write level-3 backup**

```typescript
import fs from 'fs/promises';
import path from 'path';
import tar from 'tar';
import { getWorkspacePath } from '../paths/index.js';
import { createBackupMetadata, generateBackupId, calculateChecksum } from './metadata.js';
import type { BackupOptions, BackupInfo } from '../types/backup.js';

export async function backupLevel3(options: BackupOptions): Promise<BackupInfo> {
  const id = generateBackupId();
  const name = options.name || `Full Backup ${new Date().toLocaleString()}`;

  const workspace = getWorkspacePath();

  // Create tar.gz of workspace
  const tarPath = path.join(process.cwd(), 'temp-backup.tar');

  await tar.create(
    {
      gzip: true,
      file: tarPath,
      cwd: workspace,
    },
    ['.'],
  );

  const data = await fs.readFile(tarPath);
  const checksum = calculateChecksum(data);

  // Cleanup temp
  await fs.unlink(tarPath);

  // Determine output path
  const output = options.output || path.join(process.cwd(), '.clawguard', 'backups');
  await fs.mkdir(output, { recursive: true });

  const filePath = path.join(output, `${id}.tar.gz`);
  await fs.writeFile(filePath, data);

  const metadata = createBackupMetadata(id, name, 'full', data.length, 0, false);

  return {
    metadata,
    filePath,
  };
}
```

**Step 5: Write backup index**

```typescript
import type { BackupOptions, BackupInfo } from '../types/backup.js';
import { backupLevel1 } from './level-1.js';
import { backupLevel2 } from './level-2.js';
import { backupLevel3 } from './level-3.js';

export async function backup(options: BackupOptions): Promise<BackupInfo> {
  switch (options.level) {
    case 'config':
      return backupLevel1(options);
    case 'system':
      return backupLevel2(options);
    case 'full':
      return backupLevel3(options);
    default:
      throw new Error(`Invalid backup level: ${options.level}`);
  }
}

export * from './metadata.js';
export * from './level-1.js';
export * from './level-2.js';
export * from './level-3.js';
```

**Step 6: Write backup test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { backup } from '../index.js';
import fs from 'fs/promises';
import path from 'path';

describe('Backup', () => {
  it('should backup level 1 (config files)', async () => {
    // Mock fs
    vi.mock('fs/promises');
    vi.mocked(fs.readFile).mockResolvedValue('test config');

    const result = await backup({
      level: 'config',
      name: 'Test Backup',
    });

    expect(result.metadata.level).toBe('config');
    expect(result.metadata.name).toBe('Test Backup');
    expect(result.metadata.fileCount).toBeGreaterThan(0);
  });
});
```

**Step 7: Run test**

```bash
cd packages/core && pnpm test
```

Expected: PASS

**Step 8: Commit**

```bash
git add packages/core/src/backup
git commit -m "feat: add backup module"
```

---

### Task 9: Create core package entry

**Files:**
- Create: `packages/core/src/index.ts`

**Step 1: Write core index**

```typescript
// Types
export * from './types/index.js';

// Errors
export * from './errors/index.js';

// Paths
export * from './paths/index.js';

// Encryption
export * from './encryption/index.js';

// Backup
export * from './backup/index.js';
```

**Step 2: Build core package**

```bash
cd packages/core && pnpm build
```

**Step 3: Commit**

```bash
git add packages/core/src/index.ts
git commit -m "feat: add core package entry"
```

---

## Phase 3: CLI Package (@cli/clawguard)

### Task 10: Create CLI package structure

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`

**Step 1: Write cli/package.json**

```json
{
  "name": "clawguard",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "clawguard": "./dist/index.js"
  },
  "files": [
    "dist",
    "public"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --experimentalStripTypes",
    "dev": "tsup src/index.ts --format esm --dts --watch --experimentalStripTypes",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@core/clawguard": "workspace:*",
    "cac": "^6.7.0",
    "ora": "^6.4.0",
    "chalk": "^4.1.2",
    "cli-table3": "^0.6.3"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0"
  }
}
```

**Step 2: Write cli/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Commit**

```bash
git add packages/cli/package.json packages/cli/tsconfig.json
git commit -m "feat: create CLI package structure"
```

---

### Task 11: Create CLI entry and backup command

**Files:**
- Create: `packages/cli/src/index.ts`
- Create: `packages/cli/src/commands/backup.ts`
- Create: `packages/cli/src/utils/logger.ts`
- Create: `packages/cli/src/utils/spinner.ts`

**Step 1: Write logger.ts**

```typescript
import chalk from 'chalk';

export const logger = {
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  },
  success(message: string): void {
    console.log(chalk.green('✓'), message);
  },
  error(message: string): void {
    console.log(chalk.red('✗'), message);
  },
  warn(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  },
};
```

**Step 2: Write spinner.ts**

```typescript
import ora from 'ora';

export function createSpinner(text: string) {
  return ora(text);
}
```

**Step 3: Write backup command**

```typescript
import { backup } from '@core/clawguard';
import type { BackupOptions } from '@core/clawguard';
import { createSpinner } from '../utils/spinner.js';
import { logger } from '../utils/logger.js';

export async function backupCommand(options: BackupOptions): Promise<void> {
  const spinner = createSpinner('Creating backup...').start();

  try {
    const result = await backup(options);

    spinner.succeed('Backup created successfully!');
    logger.info(`ID: ${result.metadata.id}`);
    logger.info(`Level: ${result.metadata.level}`);
    logger.info(`Size: ${(result.metadata.size / 1024).toFixed(2)} KB`);
    logger.info(`Files: ${result.metadata.fileCount}`);
  } catch (error) {
    spinner.fail('Backup failed!');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
```

**Step 4: Write CLI index**

```typescript
import cac from 'cac';
import { backupCommand } from './commands/backup.js';

const cli = cac('clawguard');

cli.version('1.0.0').help();

// Backup command
cli
  .command('backup')
  .option('--level <level>', 'Backup level: config, system, or full', {
    default: 'config',
  })
  .option('--name <name>', 'Backup name')
  .option('--output <path>', 'Output directory')
  .option('--encrypt', 'Encrypt backup')
  .action(async (options) => {
    await backupCommand({
      level: options.level,
      name: options.name,
      output: options.output,
      encrypt: options.encrypt,
    });
  });

// Parse arguments
cli.parse();
```

**Step 5: Commit**

```bash
git add packages/cli/src
git commit -m "feat: add CLI entry and backup command"
```

---

## Phase 4: Web UI Package (@web/clawguard)

### Task 12: Create Web UI package structure

**Files:**
- Create: `packages/web/package.json`
- Create: `packages/web/tsconfig.json`

**Step 1: Write web/package.json**

```json
{
  "name": "@web/clawguard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"pnpm dev:client\" \"pnpm dev:server\"",
    "dev:client": "cd client && pnpm dev",
    "dev:server": "cd server && pnpm dev",
    "build:client": "cd client && pnpm build",
    "build:server": "cd server && pnpm build"
  }
}
```

**Step 2: Commit**

```bash
git add packages/web/package.json
git commit -m "feat: create Web UI package structure"
```

---

### Task 13: Create Web client (React + Vite)

**Files:**
- Create: `packages/web/client/package.json`
- Create: `packages/web/client/vite.config.ts`
- Create: `packages/web/client/tsconfig.json`
- Create: `packages/web/client/index.html`
- Create: `packages/web/client/src/main.tsx`
- Create: `packages/web/client/src/App.tsx`

**Step 1: Write client/package.json**

```json
{
  "name": "@web/clawguard-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.1.0",
    "typescript": "^5.4.0"
  }
}
```

**Step 2: Write vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

**Step 3: Write client/tsconfig.json**

```json
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Write index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ClawGuard - OpenClaw 配置管理器</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 5: Write main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**Step 6: Write App.tsx**

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function HomePage() {
  return <div>ClawGuard v1.0.0</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Step 7: Commit**

```bash
git add packages/web/client
git commit -m "feat: add Web client (React + Vite)"
```

---

### Task 14: Create Web server (Hono)

**Files:**
- Create: `packages/web/server/package.json`
- Create: `packages/web/server/tsconfig.json`
- Create: `packages/web/server/src/index.ts`
- Create: `packages/web/server/src/routes/backup.ts`

**Step 1: Write server/package.json**

```json
{
  "name": "@web/clawguard-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --experimental-strip-types --watch src/index.ts",
    "start": "node --experimental-strip-types dist/index.js",
    "build": "tsup src/index.ts --format esm --experimentalStripTypes"
  },
  "dependencies": {
    "@core/clawguard": "workspace:*",
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsup": "^8.0.0"
  }
}
```

**Step 2: Write server/src/index.ts**

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { backupRoute } from './routes/backup.js';

const app = new Hono();

// Middleware
app.use('*', cors());

// Routes
app.route('/api/backup', backupRoute);

// Start server
const port = process.env.PORT || 3001;

Bun.serve({
  fetch: app.fetch,
  port: Number(port),
});

console.log(`ClawGuard API server running on port ${port}`);
```

**Step 3: Write server/src/routes/backup.ts**

```typescript
import { Hono } from 'hono';
import { backup } from '@core/clawguard';
import type { BackupOptions } from '@core/clawguard';

export const backupRoute = new Hono();

backupRoute.post('/create', async (c) => {
  try {
    const body = await c.req.json<Partial<BackupOptions>>();

    if (!body.level) {
      return c.json({ error: 'Missing level parameter' }, 400);
    }

    const result = await backup({
      level: body.level,
      name: body.name,
      output: body.output,
      encrypt: body.encrypt,
    });

    return c.json({
      success: true,
      data: {
        id: result.metadata.id,
        name: result.metadata.name,
        level: result.metadata.level,
        size: result.metadata.size,
        timestamp: result.metadata.timestamp,
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
```

**Step 4: Commit**

```bash
git add packages/web/server
git commit -m "feat: add Web server (Hono)"
```

---

## Phase 5: Testing

### Task 15: Add root vitest config

**Files:**
- Create: `vitest.config.ts`

**Step 1: Write vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  workspace: [
    'packages/core',
    'packages/cli',
  ],
});
```

**Step 2: Commit**

```bash
git add vitest.config.ts
git commit -m "test: add vitest config"
```

---

### Task 16: Add Playwright E2E tests

**Files:**
- Create: `playwright.config.ts`
- Create: `packages/web/e2e/backup.spec.ts`

**Step 1: Write playwright.config.ts**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './packages/web/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

**Step 2: Write E2E test**

```typescript
import { test, expect } from '@playwright/test';

test('backup page loads', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('text=ClawGuard')).toBeVisible();
});
```

**Step 3: Commit**

```bash
git add playwright.config.ts packages/web/e2e
git commit -m "test: add Playwright E2E tests"
```

---

## Phase 6: Documentation

### Task 17: Create README

**Files:**
- Create: `README.md`

**Step 1: Write README**

```markdown
# ClawGuard

OpenClaw 配置管理工具 - CLI 和 Web UI

## 安装

```bash
npm install -g clawguard
```

## 使用

### CLI 命令

```bash
# 备份
clawguard backup --level config

# 恢复
clawguard restore --id <backup-id>

# 启动 Web UI
clawguard gateway start
```

### Web UI

```bash
clawguard gateway start
```

然后访问 http://localhost:3001

## 开发

```bash
pnpm install
pnpm dev
```

## 测试

```bash
pnpm test
pnpm test:e2e
```
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

## Summary

This implementation plan covers:

1. ✅ Monorepo setup with pnpm workspace
2. ✅ Core package with types, errors, paths, encryption, backup
3. ✅ CLI package with CAC framework
4. ✅ Web UI with Hono (backend) + React/Vite (frontend)
5. ✅ Testing with Vitest and Playwright
6. ✅ Build scripts for bundling Web UI into CLI

Total tasks: 17
Estimated time: 2-3 hours
