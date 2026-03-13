export type BackupLevel = 'config' | 'system' | 'full';

export interface BackupOptions {
  level: BackupLevel;
  name?: string;
  output?: string;
  encrypt?: boolean;
}

export interface BackupMetadata {
  id: string;
  name: string;
  level: BackupLevel;
  timestamp: number;
  size: number;
  checksum: string;
  encrypted: boolean;
  fileCount: number;
}

export interface BackupInfo {
  metadata: BackupMetadata;
  filePath: string;
}
