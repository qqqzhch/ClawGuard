import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { diff } from '@core/clawguard';
import { backup } from '@core/clawguard';
import { createMetadataStore, getDefaultMetadataIndexPath } from '@core/clawguard';
import fs from 'node:fs/promises';
import fsExtra from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Diff CLI Command', () => {
  const testDir = path.join(os.tmpdir(), 'clawguard-test-diff-cli');
  const backupDir = path.join(testDir, '.clawguard', 'backups');

  beforeEach(async () => {
    await fsExtra.ensureDir(backupDir);
    const store = createMetadataStore(getDefaultMetadataIndexPath(backupDir));
    await store.clear();
  });

  afterEach(async () => {
    await fsExtra.remove(testDir);
  });

  it('should display diff between two backups', async () => {
    // Create two backups
    const result1 = await backup({ level: 'config', output: backupDir });
    const result2 = await backup({ level: 'config', output: backupDir });

    const diffResult = await diff(result1.metadata.id, result2.metadata.id, { backupDir });

    expect(diffResult.changes.length).toBeGreaterThan(0);
    expect(diffResult.summary).toContain('timestamp');
  });

  it('should format diff output', async () => {
    // Create two backups with changes
    const result1 = await backup({ level: 'config', output: backupDir });
    const result2 = await backup({ level: 'config', output: backupDir });

    const diffResult = await diff(result1.metadata.id, result2.metadata.id, { backupDir });

    // Verify result structure
    expect(diffResult).toHaveProperty('changes');
    expect(diffResult).toHaveProperty('summary');
    expect(diffResult).toHaveProperty('commonFields');
    expect(diffResult).toHaveProperty('differentFields');
    expect(Array.isArray(diffResult.changes)).toBe(true);
    expect(Array.isArray(diffResult.commonFields)).toBe(true);
    expect(Array.isArray(diffResult.differentFields)).toBe(true);
  });
});
