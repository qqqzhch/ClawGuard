import path from 'path';
import { getOpenClawRoot } from './openclaw-root.js';

export function getConfigFiles(): string[] {
  const root = getOpenClawRoot();
  return [
    path.join(root, 'config.json'),
    path.join(root, 'settings.json'),
  ];
}
