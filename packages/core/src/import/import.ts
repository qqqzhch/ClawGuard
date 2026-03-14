import fs from 'fs/promises';
import path from 'path';
import { createMetadataStore, getDefaultMetadataIndexPath } from '../metadata-store/index.js';
import { encrypt, decrypt, type EncryptResult } from '../encryption/index.js';
import { generateBackupId, calculateChecksum } from '../backup/metadata.js';
import type { BackupMetadata, BackupLevel } from '../types/backup.js';

export interface ImportOptions {
  backupDir?: string;
  decrypt?: boolean;
  name?: string;
}

export interface ImportResult {
  metadata?: BackupMetadata;
  decrypted?: boolean;
  backupPath: string;
}

export async function importBackup(
  sourceFilePath: string,
  options: ImportOptions,
): Promise<ImportResult> {
  const backupDir = options.backupDir || '.clawguard/backups';
  const metadataStore = createMetadataStore(getDefaultMetadataIndexPath(backupDir));

  // Read source file
  const data = await fs.readFile(sourceFilePath);

  let backupData = data;
  let decrypted = false;

  // Decrypt if requested
  if (options.decrypt) {
    const key = await getEncryptionKey();
    if (!key) {
      throw new Error('No encryption key found. Run: clawguard security set-key');
    }

    // Extract encrypted data structure: [data, iv, authTag]
    // Export format: Buffer.concat([data, iv, authTag])
    // So: iv + authTag = last 32 bytes (iv=16, authTag=16)
    const totalLength = data.length;
    const authTag = data.slice(totalLength - 16, totalLength) as Buffer;
    const iv = data.slice(totalLength - 32, totalLength - 16) as Buffer;
    const encryptedData = data.slice(0, totalLength - 32) as Buffer;

    const encryptResult: EncryptResult = {
      data: encryptedData,
      iv,
      authTag,
    };

    const decryptedResult = await decrypt(encryptResult, key);
    const exportResultData = Buffer.concat([
      decryptedResult,
      encryptResult.iv,
      encryptResult.authTag,
    ]);

    if (exportResultData.length !== data.length ||
      exportResultData.compare(data) !== 0) {
      throw new Error('Invalid encrypted backup file format');
    }

    backupData = Buffer.from(decryptedResult);
    decrypted = true;
  }

  // Determine backup file type and level
  const ext = path.extname(sourceFilePath);
  const isTarGz = ext === '.gz' || ext === '.tgz';
  const backupId = generateBackupId();
  const name = options.name || `Imported Backup ${new Date().toLocaleString()}`;
  let level: BackupLevel = 'config';
  let fileCount = 1;

  // Parse backup data to determine file count (for tar.gz, count entries)
  if (isTarGz) {
    level = 'full';
    fileCount = 10; // Placeholder for tar.gz entry count
  } else {
    // JSON config backup - count entries
    try {
      const jsonStr = backupData.toString('utf-8');
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed === 'object') {
        fileCount = Object.keys(parsed).length;
      }
    } catch {
      throw new Error('Invalid backup format. File may be corrupted.');
    }
  }

  // Create metadata for imported backup
  const checksum = calculateChecksum(backupData);
  const metadata: BackupMetadata = {
    id: backupId,
    name,
    level,
    timestamp: Date.now(),
    size: backupData.length,
    checksum,
    encrypted: decrypted,
    fileCount,
  };

  // Store metadata in metadata store
  await metadataStore.add(metadata);

  // Copy backup file to backup directory
  const destExt = isTarGz ? '.tar.gz' : '.json';
  const destFileName = `${backupId}${destExt}`;
  const destPath = path.join(backupDir, destFileName);
  await fs.mkdir(backupDir, { recursive: true });
  await fs.writeFile(destPath, backupData);

  return {
    metadata,
    decrypted,
    backupPath: destPath,
  };
}

async function getEncryptionKey(): Promise<Buffer | null> {
  const keyPath = path.join(
    process.env.HOME || process.env.USERPROFILE || require('os').homedir(),
    '.clawguard',
    'encryption.key',
  );
  try {
    const keyHex = await fs.readFile(keyPath, 'utf-8');
    return Buffer.from(keyHex, 'hex');
  } catch {
    return null;
  }
}
