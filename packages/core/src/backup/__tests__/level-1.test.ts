import { describe, it, expect, vi } from 'vitest';
import { backup } from '../index.js';

describe('Backup', () => {
  it('should backup level 1 (config files)', async () => {
    // Mock fs
    vi.mock('fs/promises');
    const mockFs = vi.mocked(await import('fs/promises'));
    mockFs.readFile.mockResolvedValue('test config');

    const result = await backup({
      level: 'config',
      name: 'Test Backup',
    });

    expect(result.metadata.level).toBe('config');
    expect(result.metadata.name).toBe('Test Backup');
    expect(result.metadata.fileCount).toBeGreaterThan(0);
  });
});
