import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import fsExtra from 'fs-extra';

export function getOpenClawRoot(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, '.openclaw');
}

export async function ensureOpenClawDir(): Promise<string> {
  const root = getOpenClawRoot();
  await fsExtra.ensureDir(root);
  return root;
}

export function getHomeDir(): string {
  return os.homedir();
}
