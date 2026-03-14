import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import {
  MetadataStore,
  createMetadataStore,
} from '../store.js';
import type { BackupMetadata } from '../../types/backup.js';

describe('Metadata Store', () => {
  let store: MetadataStore;
  const testPath = '/tmp/test-metadata-store.json';

  beforeEach(async () => {
    // Clean up before each test
    try {
      await fs.unlink(testPath);
    } catch {}
    store = createMetadataStore(testPath);
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await fs.unlink(testPath);
    } catch {}
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
