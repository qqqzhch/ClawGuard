import { describe, it, expect } from 'vitest';
import { getOpenClawRoot, getWorkspacePath, getSystemFilePaths } from '../index.js';

describe('Paths', () => {
  it('should return .openclaw root path', () => {
    const root = getOpenClawRoot();
    expect(root).toContain('.openclaw');
  });

  it('should return workspace path', () => {
    const workspace = getWorkspacePath();
    expect(workspace).toContain('workspace');
  });

  it('should return system file paths', () => {
    const paths = getSystemFilePaths();
    expect(paths.soul).toContain('SOUL.md');
    expect(paths.memory).toContain('MEMORY.md');
  });
});
