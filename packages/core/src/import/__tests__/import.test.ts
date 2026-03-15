import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { importBackup } from '../import.js';
import { backup } from '../../backup/index.js';
import { exportBackup } from '../../export/export.js';
import fs from 'fs/promises';
import fsExtra from 'fs-extra';
import path from 'path';
import os from 'os';
import { encrypt } from '../../encryption/index.js';
import crypto from 'crypto';

describe('Import Module', () => {
  const testDir = path.join(os.tmpdir(), 'clawguard-test-import');
  const importDir = path.join(testDir, '.clawguard', 'backups');

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

    // Export it first
    const exportPath = path.join(testDir, 'exports', `${backupResult.metadata.id}.json`);
    await exportBackup(backupResult.metadata.id, {
      backupDir: importDir,
      outputPath: exportPath,
    });

    // Import it back (use a different dir to avoid ID conflicts)
    const newImportDir = path.join(testDir, '.clawguard2', 'backups');
    await fsExtra.ensureDir(newImportDir);
    const result = await importBackup(exportPath, {
      backupDir: newImportDir,
    });

    // Verify metadata was restored (ID will be different for new import)
    expect(result.metadata).toBeDefined();
    expect(result.metadata!.level).toBe(backupResult.metadata.level);
    expect(result.metadata!.name).toContain('Imported');
    expect(result.backupPath).toBeDefined();
  });

  it('should import and decrypt encrypted backup', async () => {
    // Use test directory for key file to avoid conflicts
    const keyPath = path.join(testDir, 'encryption.key');
    // Generate a proper 32-byte key
    const key = crypto.randomBytes(32);
    await fs.writeFile(keyPath, key.toString('hex'), 'utf-8');

    try {
      // Set environment variable for test
      const originalKeyPath = process.env.CLAUGUARD_ENCRYPTION_KEY_PATH;
      process.env.CLAUGUARD_ENCRYPTION_KEY_PATH = keyPath;

      try {
        // Create a test backup
        const backupResult = await backup({
          level: 'config',
          output: importDir,
        });

        // Read and encrypt backup data
        const backupData = await fs.readFile(backupResult.filePath);

        // Encrypt backup data
        const encryptResult = await encrypt(backupData, key);
        const encryptedData = Buffer.concat([
          encryptResult.data,
          encryptResult.iv,
          encryptResult.authTag,
        ]);

        // Write encrypted backup
        const encryptedPath = path.join(testDir, 'encrypted-backup.json.enc');
        await fs.writeFile(encryptedPath, encryptedData);

        // Import and decrypt
        const result = await importBackup(encryptedPath, {
          backupDir: importDir,
          decrypt: true,
        });

        expect(result.decrypted).toBe(true);
        expect(result.metadata).toBeDefined();
      } finally {
        // Restore original environment variable
        if (originalKeyPath) {
          process.env.CLAUGUARD_ENCRYPTION_KEY_PATH = originalKeyPath;
        } else {
          delete process.env.CLAUGUARD_ENCRYPTION_KEY_PATH;
        }
      }
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });

  it('should throw error for invalid backup format', async () => {
    const invalidPath = path.join(testDir, 'invalid-backup.txt');
    await fs.writeFile(invalidPath, 'invalid data', 'utf-8');

    await expect(
      importBackup(invalidPath, {
        backupDir: importDir,
      })
    ).rejects.toThrow('Invalid backup format');
  });

  it('should throw error when decrypting without key', async () => {
    // Try to import with decrypt but no key
    // Use a non-existent file to trigger the key check
    const encryptedPath = path.join(testDir, 'nonexistent.enc');
    await fs.writeFile(encryptedPath, Buffer.from('dummy'), 'binary');

    await expect(
      importBackup(encryptedPath, {
        backupDir: importDir,
        decrypt: true,
      })
    ).rejects.toThrow('No encryption key found');
  });
});
