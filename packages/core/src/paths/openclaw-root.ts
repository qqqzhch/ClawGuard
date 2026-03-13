import path from 'path';
import os from 'os';

export function getOpenClawRoot(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, '.openclaw');
}

export async function ensureOpenClawDir(): Promise<string> {
  const root = getOpenClawRoot();
  const fs = await import('fs-extra');
  await fs.ensureDir(root);
  return root;
}
