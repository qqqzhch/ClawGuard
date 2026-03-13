import path from 'path';
import { getOpenClawRoot } from './openclaw-root.js';

export function getWorkspacePath(): string {
  return path.join(getOpenClawRoot(), 'workspace');
}

export async function ensureWorkspaceDir(): Promise<string> {
  const workspace = getWorkspacePath();
  const fs = await import('fs-extra');
  await fs.ensureDir(workspace);
  return workspace;
}
