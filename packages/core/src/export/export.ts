import fs from 'fs/promises';
import path from 'path';
import { createMetadataStore, getDefaultMetadataIndexPath } from '../metadata-store/index.js';
import { encrypt, type EncryptResult } from '../encryption/index.js';
import type { BackupMetadata } from '../types/backup.js';

export interface ExportOptions {
  backupDir?: string;
  outputPath: string;
  encrypt?: boolean;
}

export interface ExportResult {
  copiedFilePath: string;
  encrypted?: boolean;
  metadata?: BackupMetadata;
}

export async function exportBackup(
  backupId: string,
  options: ExportOptions,
): Promise<ExportResult> {
  const backupDir = options.backupDir || '.clawguard/backups';
  const metadataStore = createMetadataStore(
    getDefaultMetadataIndexPath(backupDir),
  );

  // Get metadata
  const rawMetadata = await metadataStore.get(backupId);
  if (!rawMetadata) {
    throw new Error(`Backup not found: ${backupId}`);
  }
  const metadata = { ...rawMetadata };

  // Determine backup file path
  const ext = metadata.level === 'config' ? '.json' : '.tar.gz';
  const backupPath = path.join(backupDir, `${backupId}${ext}`);

  // Read backup data
  const data = await fs.readFile(backupPath);

  let exportData = data;
  let encrypted = false;

  // Encrypt if requested
  if (options.encrypt) {
    const key = await getEncryptionKey();
    if (!key) {
      throw new Error('No encryption key found. Run: clawguard security set-key');
    }

    const encryptResult = await encrypt(data, key);
    exportData = Buffer.concat([
      encryptResult.data,
      encryptResult.iv,
      encryptResult.authTag,
    ]);
    encrypted = true;
  }

  // Ensure output directory exists
  const outputDir = path.dirname(options.outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  // Write exported file
  await fs.writeFile(options.outputPath, exportData);

  return {
    copiedFilePath: options.outputPath,
    encrypted,
    metadata,
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
