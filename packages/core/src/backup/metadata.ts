import crypto from 'crypto';
import type { BackupMetadata } from '../types/backup.js';
import type { BackupLevel } from '../types/backup.js';

export function generateBackupId(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `${timestamp}-${random}`;
}

export function createBackupMetadata(
  id: string,
  name: string,
  level: BackupLevel,
  size: number,
  fileCount: number,
  encrypted: boolean,
): BackupMetadata {
  const data = Buffer.from(
    JSON.stringify({ id, name, level, size, fileCount, encrypted }),
  );
  const checksum = crypto.createHash('sha256').update(data).digest('hex');

  return {
    id,
    name,
    level,
    timestamp: Date.now(),
    size,
    checksum,
    encrypted,
    fileCount,
  };
}

export function calculateChecksum(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
