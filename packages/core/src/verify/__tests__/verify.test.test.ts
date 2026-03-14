import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { verify, verifyAll } from '../verify.js';
import { backup } from '../../backup/index.js';
import { createMetadataStore, getDefaultMetadataIndexPath } from '../../metadata-store/index.js';
import { calculateChecksum } from '../../backup/metadata.js';
import fs from'node:fs/promises';
import fsExtra from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Verify Module', () => {
  const testDir = path.join(os.tmpdir(), 'clawguard-test-verify');
  const backupDir = path.join(testDir, '.clawguard', 'backups');
  const metadataIndexPath = getDefaultMetadataIndexPath(backupDir);

  beforeEach(async () => {
    await fsExtra.ensureDir(backupDir);
    const metadataStore = createMetadataStore(metadataIndexPath);
    await metadataStore.clear();
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
    // Create two backups
    const result1 = await backup({ level: 'config', output: backupDir });
    const result2 = await backup({ level: 'config', output: backupDir });

    // Corrupt the second backup
    const ext = '.json';
    const backupPath = path.join(backupDir, `${result2.metadata.id}${ext}`);
    await fs.writeFile(backupPath, 'corrupted data');

    // Verify all backups
    const verifyAllResult = await verifyAll({ backupDir });

    expect(verifyAllResult.total).toBe(2);
    expect(verifyAllResult.valid).toBe(1);
    expect(verifyAllResult.invalid).toBe(1);
    expect(verifyAllResult.details.some(d => !d.valid)).toBe(true);
  });
});