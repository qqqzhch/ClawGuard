import fs from 'fs/promises';
import fsExtra from 'fs-extra';
import path from 'path';
import { getWorkspacePath } from '../paths/index.js';
import {
  createBackupMetadata,
  generateBackupId,
  calculateChecksum,
} from './metadata.js';
import type { BackupInfo, BackupOptions } from '../types/backup.js';

export async function backupLevel3(
  options: Partial<BackupOptions>,
): Promise<BackupInfo> {
  const id = generateBackupId();
  const name = options.name || `Full Backup ${new Date().toLocaleString()}`;

  const workspace = getWorkspacePath();

  // Create tar.gz of workspace
  const tarPath = path.join(process.cwd(), 'temp-backup.tar');
  const tar = await import('tar');

  await tar.create(
    {
      gzip: true,
      file: tarPath,
      cwd: workspace,
    },
    ['.'],
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
    'full',
    data.length,
    0,
    false,
    checksum,
  );

  return {
    metadata,
    filePath,
  };
}
