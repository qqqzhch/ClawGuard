import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
    // Create a test backup
    const backupResult = await backup({
      level: 'config',
      output: backupDir,
    });

    // Export to a different location
    const exportPath = path.join(testDir, 'exports', `${backupResult.metadata.id}.json`);
    const result = await exportBackup(backupResult.metadata.id, {
      backupDir,
      outputPath: exportPath,
    });

    // Verify file was copied
    await expect(fs.access(result.copiedFilePath)).resolves.toBeUndefined();
    expect(result.copiedFilePath).toBe(exportPath);
  });

  it('should throw error when backup not found', async () => {
    const exportPath = path.join(testDir, 'exports', 'nonexistent.json');
    await expect(
      exportBackup('nonexistent-id', {
        backupDir,
        outputPath: exportPath,
      })
    ).rejects.toThrow('Backup not found: nonexistent-id');
  });

  it('should export and encrypt backup when encrypt option is true', async () => {
    // Mock encryption key
    const keyPath = path.join(
      process.env.HOME || process.env.USERPROFILE || os.homedir(),
      '.clawguard',
      'encryption.key'
    );
    await fsExtra.ensureDir(path.dirname(keyPath));
    await fs.writeFile(
      keyPath,
      'a'.repeat(32).split('').map(() => '0f').join(''), // 32 bytes as hex
      'utf-8'
    );

    try {
      const backupResult = await backup({
        level: 'config',
        output: backupDir,
      });

      const exportPath = path.join(testDir, 'exports-enc', `${backupResult.metadata.id}.json.enc`);
      const result = await exportBackup(backupResult.metadata.id, {
        backupDir,
        outputPath: exportPath,
        encrypt: true,
      });

      expect(result.encrypted).toBe(true);
      expect(result.copiedFilePath).toBe(exportPath);
      await expect(fs.access(result.copiedFilePath)).resolves.toBeUndefined();
    } finally {
      // Cleanup
      try {
        await fsExtra.remove(path.dirname(keyPath));
      } catch {}
    }
  });
});
