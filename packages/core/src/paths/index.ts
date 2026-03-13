export * from './openclaw-root.js';
export * from './config-files.js';
export * from './system-files.js';
export * from './workspace.js';

import type { OpenClawPaths } from '../types/config.js';
import { getOpenClawRoot } from './openclaw-root.js';
import { getConfigFiles } from './config-files.js';
import { getSystemFilePaths } from './system-files.js';
import { getWorkspacePath } from './workspace.js';

export function getOpenClawPaths(): OpenClawPaths {
  return {
    root: getOpenClawRoot(),
    workspace: getWorkspacePath(),
    configFiles: getConfigFiles(),
    systemFiles: getSystemFilePaths(),
  };
}
