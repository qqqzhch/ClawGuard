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
