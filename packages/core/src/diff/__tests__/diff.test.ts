import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { diff } from '../diff.js';
import { backup } from '../../backup/index.js';
import { createMetadataStore, getDefaultMetadataIndexPath } from '../../metadata-store/index.js';
import fs from 'node:fs/promises';
import fsExtra from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Diff Module', () => {
  const testDir = path.join(os.tmpdir(), 'clawguard-test-diff');
  const backupDir = path.join(testDir, '.clawguard', 'backups');

  beforeEach(async () => {
    await fsExtra.ensureDir(backupDir);
    const store = createMetadataStore(getDefaultMetadataIndexPath(backupDir));
    await store.clear();
  });

  afterEach(async () => {
    await fsExtra.remove(testDir);
  });

  it('should return empty diff for identical backups', async () => {
    // Create test backup data
    const backupData1 = {
      'field1': 'value1',
      'field2': 'value2',
    };
    const backupData2 = {
      'field1': 'value1',
      'field2': 'value2',
    };

    const id1 = Date.now().toString() + '-test1';
    const id2 = Date.now().toString() + '-test2';

    const metadataPath = getDefaultMetadataIndexPath(backupDir);
    const store = createMetadataStore(metadataPath);

    // Write backup files and metadata
    await fs.writeFile(path.join(backupDir, `${id1}.json`), JSON.stringify(backupData1));
    await fs.writeFile(path.join(backupDir, `${id2}.json`), JSON.stringify(backupData2));

    await store.add({
      id: id1,
      name: 'Backup 1',
      level: 'config',
      timestamp: Date.now(),
      size: JSON.stringify(backupData1).length,
      fileCount: 2,
      checksum: 'mock-checksum-1',
      encrypted: false,
      filePath: path.join(backupDir, `${id1}.json`),
    });

    await store.add({
      id: id2,
      name: 'Backup 2',
      level: 'config',
      timestamp: Date.now(),
      size: JSON.stringify(backupData2).length,
      fileCount: 2,
      checksum: 'mock-checksum-2',
      encrypted: false,
      filePath: path.join(backupDir, `${id2}.json`),
    });

    const diffResult = await diff(id1, id2, { backupDir });

    expect(diffResult.changes).toEqual([]);
    expect(diffResult.summary).toBe('No changes detected');
  });

  it('should detect added fields', async () => {
    const backupData1 = {
      'field1': 'value1',
    };
    const backupData2 = {
      'field1': 'value1',
      'field2': 'value2',
    };

    const id1 = Date.now().toString() + '-test1';
    const id2 = Date.now().toString() + '-test2';

    const metadataPath = getDefaultMetadataIndexPath(backupDir);
    const store = createMetadataStore(metadataPath);

    await fs.writeFile(path.join(backupDir, `${id1}.json`), JSON.stringify(backupData1));
    await fs.writeFile(path.join(backupDir, `${id2}.json`), JSON.stringify(backupData2));

    await store.add({
      id: id1,
      name: 'Backup 1',
      level: 'config',
      timestamp: Date.now(),
      size: JSON.stringify(backupData1).length,
      fileCount: 1,
      checksum: 'mock-checksum-1',
      encrypted: false,
      filePath: path.join(backupDir, `${id1}.json`),
    });

    await store.add({
      id: id2,
      name: 'Backup 2',
      level: 'config',
      timestamp: Date.now(),
      size: JSON.stringify(backupData2).length,
      fileCount: 2,
      checksum: 'mock-checksum-2',
      encrypted: false,
      filePath: path.join(backupDir, `${id2}.json`),
    });

    const diffResult = await diff(id1, id2, { backupDir });

    expect(diffResult.changes.length).toBe(1);
    expect(diffResult.changes[0].field).toBe('field2');
    expect(diffResult.changes[0].type).toBe('added');
  });

  it('should detect deleted fields', async () => {
    const backupData1 = {
      'field1': 'value1',
      'field2': 'value2',
    };
    const backupData2 = {
      'field1': 'value1',
    };

    const id1 = Date.now().toString() + '-test1';
    const id2 = Date.now().toString() + '-test2';

    const metadataPath = getDefaultMetadataIndexPath(backupDir);
    const store = createMetadataStore(metadataPath);

    await fs.writeFile(path.join(backupDir, `${id1}.json`), JSON.stringify(backupData1));
    await fs.writeFile(path.join(backupDir, `${id2}.json`), JSON.stringify(backupData2));

    await store.add({
      id: id1,
      name: 'Backup 1',
      level: 'config',
      timestamp: Date.now(),
      size: JSON.stringify(backupData1).length,
      fileCount: 2,
      checksum: 'mock-checksum-1',
      encrypted: false,
      filePath: path.join(backupDir, `${id1}.json`),
    });

    await store.add({
      id: id2,
      name: 'Backup 2',
      level: 'config',
      timestamp: Date.now(),
      size: JSON.stringify(backupData2).length,
      fileCount: 1,
      checksum: 'mock-checksum-2',
      encrypted: false,
      filePath: path.join(backupDir, `${id2}.json`),
    });

    const diffResult = await diff(id1, id2, { backupDir });

    expect(diffResult.changes.length).toBe(1);
    expect(diffResult.changes[0].field).toBe('field2');
    expect(diffResult.changes[0].type).toBe('deleted');
    expect(diffResult.changes[0].backupId).toBe(id1);
  });

  it('should compare tar.gz backups by file count', async () => {
    const id1 = Date.now().toString() + '-test1';
    const id2 = Date.now().toString() + '-test2';

    const metadataPath = getDefaultMetadataIndexPath(backupDir);
    const store = createMetadataStore(metadataPath);

    // Create dummy tar.gz files
    await fs.writeFile(path.join(backupDir, `${id1}.tar.gz`), 'dummy content 1');
    await fs.writeFile(path.join(backupDir, `${id2}.tar.gz`), 'dummy content 2');

    await store.add({
      id: id1,
      name: 'Backup 1',
      level: 'system',
      timestamp: Date.now(),
      size: 15,
      fileCount: 5,
      checksum: 'mock-checksum-1',
      encrypted: false,
      filePath: path.join(backupDir, `${id1}.tar.gz`),
    });

    await store.add({
      id: id2,
      name: 'Backup 2',
      level: 'system',
      timestamp: Date.now(),
      size: 16,
      fileCount: 6,
      checksum: 'mock-checksum-2',
      encrypted: false,
      filePath: path.join(backupDir, `${id2}.tar.gz`),
    });

    const diffResult = await diff(id1, id2, { backupDir });

    expect(diffResult.changes.length).toBeGreaterThan(0);
    expect(diffResult.changes.some(c => c.field === 'size')).toBe(true);
    expect(diffResult.changes.some(c => c.field === 'fileCount')).toBe(true);
  });

  it('should ignore specific fields when comparing', async () => {
    const backupData1 = {
      'field1': 'value1',
      'timestamp': 123456,
    };
    const backupData2 = {
      'field1': 'value1',
      'timestamp': 789012,
    };

    const id1 = Date.now().toString() + '-test1';
    const id2 = Date.now().toString() + '-test2';

    const metadataPath = getDefaultMetadataIndexPath(backupDir);
    const store = createMetadataStore(metadataPath);

    await fs.writeFile(path.join(backupDir, `${id1}.json`), JSON.stringify(backupData1));
    await fs.writeFile(path.join(backupDir, `${id2}.json`), JSON.stringify(backupData2));

    await store.add({
      id: id1,
      name: 'Backup 1',
      level: 'config',
      timestamp: Date.now(),
      size: JSON.stringify(backupData1).length,
      fileCount: 2,
      checksum: 'mock-checksum-1',
      encrypted: false,
      filePath: path.join(backupDir, `${id1}.json`),
    });

    await store.add({
      id: id2,
      name: 'Backup 2',
      level: 'config',
      timestamp: Date.now(),
      size: JSON.stringify(backupData2).length,
      fileCount: 2,
      checksum: 'mock-checksum-2',
      encrypted: false,
      filePath: path.join(backupDir, `${id2}.json`),
    });

    const diffResult = await diff(id1, id2, {
      backupDir,
      ignoreFields: ['timestamp'],
    });

    expect(diffResult.changes.length).toBe(0);
  });

  it('should throw error for non-existent backup', async () => {
    await expect(
      diff('nonexistent-id', 'some-other-id', { backupDir })
    ).rejects.toThrow('Backup not found: nonexistent-id');
  });

  it('should throw error when backups are from different levels', async () => {
    const id1 = Date.now().toString() + '-test1';
    const id2 = Date.now().toString() + '-test2';

    const metadataPath = getDefaultMetadataIndexPath(backupDir);
    const store = createMetadataStore(metadataPath);

    await fs.writeFile(path.join(backupDir, `${id1}.json`), '{}');
    await fs.writeFile(path.join(backupDir, `${id2}.tar.gz`), 'dummy');

    await store.add({
      id: id1,
      name: 'Backup 1',
      level: 'config',
      timestamp: Date.now(),
      size: 2,
      fileCount: 0,
      checksum: 'mock-checksum-1',
      encrypted: false,
      filePath: path.join(backupDir, `${id1}.json`),
    });

    await store.add({
      id: id2,
      name: 'Backup 2',
      level: 'system',
      timestamp: Date.now(),
      size: 5,
      fileCount: 0,
      checksum: 'mock-checksum-2',
      encrypted: false,
      filePath: path.join(backupDir, `${id2}.tar.gz`),
    });

    await expect(
      diff(id1, id2, { backupDir })
    ).rejects.toThrow('Cannot compare backups of different levels');
  });
});
