export interface ClawGuardConfig {
  backupDir: string;
  encryptionKey?: string;
  retainDays: number;
  autoBackupEnabled: boolean;
  autoBackupCron: string;
}

export interface OpenClawPaths {
  root: string;
  workspace: string;
  configFiles: string[];
  systemFiles: {
    soul: string;
    user: string;
    memory: string;
    memoryDir: string;
    subagents: string;
    heartbeat: string;
    tools: string;
    agents: string;
  };
}
