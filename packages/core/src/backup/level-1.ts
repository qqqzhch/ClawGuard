import fs from 'fs/promises';
import fsExtra from 'fs-extra';
import path from 'path';
import { getConfigFiles, getOpenClawRoot } from '../paths/index.js';
import {
  createBackupMetadata,
  generateBackupId,
  calculateChecksum,
} from './metadata.js';
import type { BackupInfo, BackupOptions } from '../types/backup.js';

export async function backupLevel1(
  options: Partial<BackupOptions>,
): Promise<BackupInfo> {
  const id = generateBackupId();
  const name = options.name || `Backup ${new Date().toLocaleString()}`;

  // Get config files
  const files = getConfigFiles();

  // Create backup data as JSON
  const backupData: Record<string, unknown> = {};
  let fileCount = 0;

  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      backupData[filePath] = content;
      fileCount++;
    } catch (error) {
      console.error(`Failed to read ${filePath}:`, error);
      // File doesn't exist, skip
    }
  }

  const data = Buffer.from(JSON.stringify(backupData));
  const checksum = calculateChecksum(data);

  // Determine output path
  const output = options.output || path.join(getOpenClawRoot(), 'backups');
  await fsExtra.mkdir(output, { recursive: true });

  const filePath = path.join(output, `${id}.json`);
  await fs.writeFile(filePath, data);

  const metadata = createBackupMetadata(
    id,
    name,
    'config',
    data.length,
    fileCount,
    false,
    checksum,
  );

  return {
    metadata,
    filePath,
  };
}
