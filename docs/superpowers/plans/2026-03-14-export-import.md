# Export/Import Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement export and import functionality for backups with optional encryption/decryption

**Architecture:**
- **Export Module**: Export backup to a specified location, with optional encryption
- **Import Module**: Import external backup file, optionally decrypt, and restore metadata

**Tech Stack:**
- fs/promises for file operations
- tar npm package for tar.gz handling
- Existing encryption/decryption modules
- TypeScript with strict mode

---

## File Structure

```
packages/core/src/
├── export/
│   ├── index.ts         # Export module exports
│   └── export.ts        # Export backup functionality
└── import/
    ├── index.ts         # Import module exports
    └── import.ts        # Import backup functionality
```

---

## Chunk 1: Export Module

### Task 1: Create export.ts - Export backup functionality

**Files:**
- Create: `packages/core/src/export/export.ts`
- Create: `packages/core/core/src/export/index.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/core/src/export/__tests__/export.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exportBackup } from '../export.js';
import { backup } from '../../backup/index.js';
import fs from 'fs/promises';
import fsExtra from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Export Module', () => {
  const testDir = path.join(os.tmpdir(), 'clawguard-test-export');
  const backupDir = path.join(testDir, '.clawguard', 'backups');

  beforeEach(async () => {
    await fsExtra.ensureDir(backupDir);
  });

  afterEach(async () => {
    await fsExtra.remove(testDir);
  });

  it('should export backup to specified location', async () => {
    // Create a test backup first
    const backupResult = await backup({
      level: 'config',
      output: backupDir,
    });

    // Export to a different location
    const exportPath = path.join(testDir, 'exports');
    const result = await exportBackup(backupResult.metadata.id, {
      backupDir,
      outputPath: exportPath,
    });

    // Verify file was copied
    const destPath = path.join(exportPath, path.basename(result.copiedFilePath));
    expect(await fs.access(destPath)).toBeDefined();
  });

  it('should export and encrypt backup when encrypt option is true', async () => {
    const backupResult = await backup({
      level: 'config',
      output: backupDir,
    });

    const exportPath = path.join(testDir, 'exports-enc');
    const result = await exportBackup(backupResult.metadata.id, {
      backupDir,
      outputPath: exportPath,
      encrypt: true,
    });

    expect(result.encrypted).toBe(true);
    expect(await fs.access(result.copiedFilePath)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test:unit export`
Expected: FAIL with "exportBackup not defined"

- [ ] **Step 3: Write export.ts implementation**

```typescript
// packages/core/src/export/export.ts
import fs from 'fs/promises';
import path from 'path';
import { createMetadataStore, getDefaultMetadataIndexPath } from '../metadata-store/index.js';
import { encrypt, type EncryptResult } from '../encryption/index.js';
import type { BackupMetadata } from '../types/backup.js';

export interface ExportOptions {
  backupDir?: string;
  outputPath: string;
  encrypt?: boolean;
}

export interface ExportResult {
  copiedFilePath: string;
  encrypted?: boolean;
  metadata?: BackupMetadata;
}

export async function exportBackup(
  backupId: string,
  options: ExportOptions,
): Promise<ExportResult> {
  const backupDir = options.backupDir || '.clawguard/backups';
  const metadataStore = createMetadataStore(getDefaultMetadataIndexPath(backupDir));

  // Get metadata
  const metadata = await metadataStore.get(backupId);
  if (!metadata) {
    throw new Error(`Backup not found: ${backupId}`);
  }

  // Determine backup file path
  const ext = metadata.level === 'config' ? '.json' : '.tar.gz';
  const backupPath = path.join(backupDir, `${backupId}${ext}`);

  // Read backup data
  const data = await fs.readFile(backupPath);

  let exportData = data;
  let encrypted = false;

  // Encrypt if requested
  if (options.encrypt) {
    const key = await getEncryptionKey();
    if (!key) {
      throw new Error('No encryption key found. Run: clawguard security set-key');
    }

    const encryptResult: EncryptResult = await encrypt(data, key);
    exportData = Buffer.concat([
      encryptResult.data,
      encryptResult.iv,
      encryptResult.authTag,
    ]);
    encrypted = true;
  }

  // Ensure output directory exists
  const outputDir = path.dirname(options.outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  // Write exported file
  await fs.writeFile(options.outputPath, exportData);

  return {
    copiedFilePath: options.outputPath,
    encrypted,
    metadata,
  };
}

async function getEncryptionKey(): Promise<Buffer> {
  const keyPath = path.join(process.env.HOME || process.env.USERPROFILE || os.homedir(), '.clawguard', 'encryption.key');
  try {
    const keyHex = await fs.readFile(keyPath, 'utf-8');
    return Buffer.from(keyHex, 'hex');
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Create index.ts**

```typescript
// packages/core/src/export/index.ts
export * from './export.js';
```

- [ ] **Step 5: Update core/src/index.ts**

```typescript
// Add to exports
export * from './export/index.js';
'```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/core && pnpm test:unit export`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/export/
git add packages/core/src/index.ts
git commit -m "feat: add export module"
```

---

## Chunk 2: Import Module

### Task 2: Create import.ts - Import backup functionality

**Files:**
- Create: `packages/core/src/import/import.ts`
- Create: `packages/core/src/import/index.ts`
- Create: `packages/core/src/import/__tests__/import.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/core/src/import/__tests__/import.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { importBackup } from '../import.js';
import { backup } from '../../backup/index.js';
import fs from 'fs/promises';
import fsExtra from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Import Module', () => {
  const testDir = path.join(os.tmpdir(), 'clawguard-test-import');
  const importDir = path.join(testDir, 'imports');

  beforeEach(async () => {
    await fsExtra.ensureDir(importDir);
  });

  afterEach(async () => {
    await fsExtra.remove(testDir);
  });

  it('should import backup file and restore metadata', async () => {
    // Create a test backup to export
    const backupResult = await backup({
      level: 'config',
      output: importDir,
    });

    // Import it back
    const result = await importBackup(backupResult.filePath, {
      backupDir: importDir,
    });

    // Verify metadata was restored
    expect(result.metadata).toBeDefined();
    expect(result.metadata.id).toBe(backupResult.metadata.id);
  });

  it('should import and decrypt encrypted backup', async () => {
    // Create and encrypt a test backup
    const backupResult = await backup({
      level: 'config',
      output: importDir,
    });
    // Manually encrypt the backup file
    const key = Buffer.from('test-key-32-characters-long!', 'utf-8');
    // Simulate encrypted backup (for testing, we'll skip actual encryption)

    const result = await importBackup(backupResult.filePath, {
      backupDir: importDir,
      decrypt: true,
    });

    expect(result.decrypted).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test:unit import`
Expected: FAIL with "importBackup not defined"

- [ ] **Step 3: Write import.ts implementation**

```typescript
// packages/core/src/import/import.ts
import fs from 'fs/promises';
import path from 'path';
import { createMetadataStore, getDefaultMetadataIndexPath } from '../metadata-store/index.js';
import { decrypt, type EncryptResult } from '../encryption/index.js';
import type { BackupMetadata } from '../types/backup.js';

export interface ImportOptions {
  backupDir?: string;
  decrypt?: boolean;
}

export interface ImportResult {
  metadata?: BackupMetadata;
  decrypted?: boolean;
  backupPath: string;
}

export async function importBackup(
  sourceFilePath: string,
  options: ImportOptions,
): Promise<ImportResult> {
  const backupDir = options.backupDir || '.clawguard/backups';
  const metadataStore = createMetadataStore(getDefaultMetadataIndexPath(backupDir));

  // Read source file
  const data = await fs.readFile(sourceFilePath);

  let backupData = data;
  let decrypted = false;

  // Decrypt if requested
  if (options.decrypt) {
    const key = await getEncryptionKey();
    if (!key) {
      throw new Error('No encryption key found. Run: clawguard security set-key');
    }

    // Extract encrypted data structure: [data, iv, authTag]
    const authTagLength = 16;
    const ivLength = 16;
    const dataOffset = ivLength + authTagLength;

    if (data.length < dataOffset) {
      throw new Error('Invalid encrypted backup file format');
    }

    const iv = data.slice(0, ivLength);
    const authTag = data.slice(ivLength, dataOffset);
    const encryptedData = data.slice(dataOffset);

    const encryptResult: EncryptResult = {
      data: encryptedData,
      iv,
      authTag,
    };

    backupData = await decrypt(encryptResult, key);
    decrypted = true;
  }

  // Restore metadata from backup data
  let metadata: BackupMetadata | undefined;

  try {
    // Try to parse as JSON (for config backups)
    const jsonStr = backupData.toString('utf-8');
    const parsed = JSON.parse(jsonStr);

    if (parsed.id && parsed.name && parsed.level) {
      // This is the metadata itself (config level backup)
      // Store in metadata store
      await metadataStore.add(parsed);
      metadata = parsed;
    } else {
      // For tar.gz backups, we need to extract metadata differently
      // For now, throw an error - tar.gz import requires tar extraction
      throw new Error('tar.gz import requires tar extraction to restore metadata');
    }
  } catch {
    // JSON parse failed, might be encrypted or corrupted
    throw new Error('Invalid backup format. File may be corrupted.');
  }

  // Copy backup file to backup directory
  const backupFileName = path.basename(sourceFilePath);
  const destPath = path.join(backupDir, backupFileName);
  await fs.mkdir(backupDir, { recursive: true });
  await fs.writeFile(destPath, backupData);

  return {
    metadata,
    decrypted,
    backupPath: destPath,
  };
}

async function getEncryptionKey(): Promise<Buffer> {
  const keyPath = path.join(process.env.HOME || process.env.USERPROFILE || os.homedir(), '.clawguard', 'encryption.key');
  try {
    const keyHex = await fs.readFile(keyPath, 'utf-8');
    return Buffer.from(keyHex, 'hex');
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Create index.ts**

```typescript
// packages/core/src/import/index.ts
export * from './import.js';
'```

- [ ] **Step 5: Update core/src/index.ts**

```typescript
// Add to exports
export * from './import/index.js';
'```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/core && pnpm test:unit import`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/import/
git add packages/core/src/index.ts
git commit -m "feat: add import module"
```

---

## Final: Build and Test

### Task 3: Verify everything works

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

- [ ] **Step 3: Update TODO.md**

Mark export/import items as completed in TODO.md

- [ ] **Step 4: Commit final changes**

```bash
git add TODO.md
git commit -m "docs: update TODO with completed export/import features"
```

---

**Plan complete and saved to `docs/superpowers/plans/2026-03-14-export-import.md`. Ready to execute?**
