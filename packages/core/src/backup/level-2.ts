import fs from 'fs/promises';
import fsExtra from 'fs-extra';
import path from 'path';
import os from 'os';
import { getConfigFiles } from '../paths/index.js';
import { getSystemFilePaths } from '../paths/index.js';
import {
  createBackupMetadata,
  generateBackupId,
  calculateChecksum,
} from './metadata.js';
import type { BackupInfo, BackupOptions } from '../types/backup.js';

export async function backupLevel2(
  options: Partial<BackupOptions>,
): Promise<BackupInfo> {
  const id = generateBackupId();
  const name = options.name || `System Backup ${new Date().toLocaleString()}`;

  // Get files to backup
  const files = [...getConfigFiles(), ...Object.values(getSystemFilePaths())];

  // Create tar.gz
  const tarPath = path.join(process.cwd(), 'temp-backup.tar');
  const tar = await import('tar');

  await tar.create(
    {
      gzip: true,
      file: tarPath,
      cwd: path.join(os.homedir(), '.openclaw'),
    },
    files.map(f => path.basename(f)),
  );

  const data = await fs.readFile(tarPath);
  const checksum = calculateChecksum(data);

  // Cleanup temp
  await fs.unlink(tarPath);

  // Determine output path
  const output = options.output || path.join(process.cwd(), '.clawguard', 'backups');
  await fsExtra.mkdir(output, { recursive: true });

  const filePath = path.join(output, `${id}.tar.gz`);
  await fs.writeFile(filePath, data);

  const metadata = createBackupMetadata(
    id,
    name,
    'system',
    data.length,
    files.length,
    false,
  );

  return {
    metadata,
    filePath,
  };
}
