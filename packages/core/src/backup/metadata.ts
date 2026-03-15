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
  dataChecksum?: string,
): BackupMetadata {
  // 如果提供了数据校验和，使用它；否则使用 metadata 对象的校验和
  let checksum: string;
  if (dataChecksum) {
    checksum = dataChecksum;
  } else {
    const data = Buffer.from(
      JSON.stringify({ id, name, level, size, fileCount, encrypted }),
    );
    checksum = crypto.createHash('sha256').update(data).digest('hex');
  }

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
