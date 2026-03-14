import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verify, verifyAll, type VerifyResult } from '../verify.js';
import { backup } from '../../backup/index.js';
import { createMetadataStore, getDefaultMetadataIndexPath } as getMetadataIndexPath } from '../../metadata-store/index.js';
import fs from 'node:fs/promises';
import fsExtra from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Verify Module', () => {
  const testDir = path.join(os.tmpdir(), 'clawguard-test-verify');
  const backupDir = path.join(testDir, '.clawguard', 'backups');
  const metadataIndexPath = getMetadataIndexPath(backupDir);

  beforeEach(async () => {
    await fsExtra.ensureDir(backupDir);
    const store = createMetadataStore(metadataIndexPath);
    await store.clear();
  });

  afterEach(async () => {
    await fsExtra.remove(testDir);
  });

  it('should return valid for existing backup with correct checksum', async () => {
    // Create a backup
    const result = await backup({ level: 'config', output: backupDir });

    // Verify of backup
    const verifyResult = await verify(result.metadata.id, { backupDir });

    expect(verifyResult.valid).toBe(true);
    expect(verifyResult.message).toBe('Backup is valid');
    expect(verifyResult.checksum).toBe(result.metadata.checksum);
  });

  it('should return invalid for corrupted backup', async () => {
    // Create a backup
    const result = await backup({ level: 'config', output: backupDir });

    // Corrupt of backup file (modify it)
    const ext = result.metadata.level === 'config' ? '.json' : '.tar.gz';
    const backupPath = path.join(backupDir, `${result.metadata.id}${ext}`);
    const backupData = await fs.readFile(backupPath);
    await fs.writeFile(backupPath, 'corrupted data');

    // Verify of corrupted backup
    const verifyResult = await verify(result.metadata.id, { backupDir });

    expect(verifyResult.valid).toBe(false);
    expect(verifyResult.message).toContain('corrupted');
  });

  it('should return not found for non-existent backup', async () => {
    const verifyResult = await verify('nonexistent-id', { backupDir });

    expect(verifyResult.valid).toBe(false);
    expect(verifyResult.message).toBe('Backup not found');
  });

  it('should verify all backups', async () => {
    // Create two backups
    await backup({ level: 'config', output: backupDir });
    await backup({ level: 'config', output: backupDir });

    // Verify all backups
    const verifyAllResult = await verifyAll({ backupDir });

    expect(verifyAllResult.total).toBe(2);
    expect(verifyAllResult.valid).toBe(2);
    expect(verifyAllResult.invalid).toBe(0);
    expect(verifyAllResult.details).toHaveLength(2);
    expect(verifyAllResult.details.every(d => d.valid)).toBe(true);
  });

  it('should handle mix of valid and invalid backups', async () => {
    // Create one valid and one corrupted backup
    const result1 = await backup({ level: 'config', output: backupDir });

    // Create second backup
    const result2 = await backup({ level: 'config', output: backupDir });

    // Corrupt the second backup file
    const ext = '.json';
    const backupPath2 = path.join(backupDir, `${result2.metadata.id}${ext}`);
    const backupData = await fs.readFile(path.join(backupDir, `${result1.metadata.id}${ext}`));
    await fs.writeFile(backupPath2, 'corrupted data');

    // Verify all backups
    const verifyAllResult = await verifyAll({ backupDir });

    expect(verifyAllResult.total).toBe(2);
    expect(verifyAllResult.valid).toBe(1);
    expect(verifyAllResult.invalid).toBe(1);
  });
});
