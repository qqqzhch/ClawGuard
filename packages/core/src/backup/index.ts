import { backupLevel1 } from './level-1.js';
import { backupLevel2 } from './level-2.js';
import { backupLevel3 } from './level-3.js';
import { createMetadataStore, getDefaultMetadataIndexPath } from '../metadata-store/index.js';
import type { BackupOptions, BackupInfo } from '../types/backup.js';

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

  // Store metadata in metadata store
  await metadataStore.add(result.metadata);

  return result;
}

export * from './metadata.js';
export * from './level-1.js';
export * from './level-2.js';
export * from './level-3.js';
