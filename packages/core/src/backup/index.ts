import { backupLevel1 } from './level-1.js';
import { backupLevel2 } from './level-2.js';
import { backupLevel3 } from './level-3.js';
import { createMetadataStore, getDefaultMetadataIndexPath } from '../metadata-store/index.js';
import type { BackupOptions, BackupInfo, BackupMetadata } from '../types/backup.js';
import fs from 'fs/promises';
import path from 'path';

export async function backup(
  options: BackupOptions,
): Promise<BackupInfo> {
  const backupDir = options.output || '.clawguard/backups';
  const metadataStore = createMetadataStore(getDefaultMetadataIndexPath(backupDir));

  let result: BackupInfo;
  switch (options.level) {
    case 'config':
      result = await backupLevel1(options);
      break;
    case 'system':
      result = await backupLevel2(options);
      break;
    case 'full':
      result = await backupLevel3(options);
      break;
    default:
      throw new Error(`Invalid backup level: ${options.level}`);
  }

  // Store metadata
  await metadataStore.add(result.metadata);

  return result;
}

export async function listBackups(): Promise<BackupInfo[]> {
  const backupDir = '.clawguard/backups';
  const metadataStore = createMetadataStore(getDefaultMetadataIndexPath(backupDir));
  const metadatas = await metadataStore.list();

  return metadatas.map(metadata => ({
    metadata,
    filePath: path.join(backupDir, `${metadata.id}.tar.gz`),
  }));
}

export async function getBackupMetadata(
  id: string,
  backupDir?: string
): Promise<BackupInfo | null> {
  const dir = backupDir || '.clawguard/backups';
  const metadataStore = createMetadataStore(getDefaultMetadataIndexPath(dir));
  const metadata = await metadataStore.get(id);

  if (!metadata) {
    return null;
  }

  return {
    metadata,
    filePath: path.join(dir, `${metadata.id}.tar.gz`),
  };
}

export async function createBackup(
  options: BackupOptions,
): Promise<BackupInfo> {
  return backup(options);
}

export async function deleteBackup(id: string): Promise<void> {
  const metadataStore = createMetadataStore(getDefaultMetadataIndexPath('.clawguard/backups'));
  await metadataStore.delete(id);
}

export async function restoreBackup(options: {
  backupId: string;
  dryRun?: boolean;
  targetPath?: string;
}): Promise<{
  filesRestored?: number;
  duration?: number;
}> {
  const { restoreBackupImpl } = await import('../restore/index.js');
  const result = await restoreBackupImpl(options);
  return {
    filesRestored: result.filesRestored,
    duration: result.duration,
  };
}
