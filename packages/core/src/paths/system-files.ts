import path from 'path';
import { getOpenClawRoot } from './openclaw-root.js';

export function getSystemFilePaths() {
  const root = getOpenClawRoot();
  return {
    soul: path.join(root, 'SOUL.md'),
    user: path.join(root, 'USER.md'),
    memory: path.join(root, 'MEMORY.md'),
    memoryDir: path.join(root, 'memory'),
    subagents: path.join(root, 'SUBAGENTS.md'),
    heartbeat: path.join(root, 'HEARTBEAT.md'),
    tools: path.join(root, 'TOOLS.md'),
    agents: path.join(root, 'AGENTS.md'),
  };
}
