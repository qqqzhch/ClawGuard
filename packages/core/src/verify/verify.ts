import fs from 'fs/promises';
import path from 'path';
import { createMetadataStore, getDefaultMetadataIndexPath } from '../metadata-store/index.js';
import { calculateChecksum } from '../backup/metadata.js';
import type { BackupLevel } from '../types/backup.js';

export interface VerifyOptions {
  backupDir?: string;
}

export interface VerifyResult {
  valid: boolean;
  message: string;
  checksum?: string;
  backupId: string;
}

export interface VerifyAllResult {
  total: number;
  valid: number;
  invalid: number;
  details: VerifyResult[];
}

export async function verify(
  backupId: string,
  options?: VerifyOptions,
): Promise<VerifyResult> {
  const backupDir = options?.backupDir || '.clawguard/backups';
  const metadataStore = createMetadataStore(getDefaultMetadataIndexPath(backupDir));

  // Get backup metadata
  const metadata = await metadataStore.get(backupId);

  if (!metadata) {
    return {
      backupId,
      valid: false,
      message: 'Backup not found',
    };
  }

  // Determine backup file path based on level
  const ext = metadata.level === 'config' ? '.json' : '.tar.gz';
  const backupPath = path.join(backupDir, `${backupId}${ext}`);

  try {
    // Read backup file
    const data = await fs.readFile(backupPath);

    // Calculate checksum
    const actualChecksum = calculateChecksum(data as Buffer);

    // Compare with stored checksum
    if (actualChecksum === metadata.checksum) {
      return {
        backupId,
        valid: true,
        message: 'Backup is valid',
        checksum: actualChecksum,
      };
    } else {
      return {
        backupId,
        valid: false,
        message: 'Backup is corrupted: checksum mismatch',
        checksum: actualChecksum,
      };
    }
  } catch (error) {
    return {
      backupId,
      valid: false,
      message: `Error reading backup file: ${error}`,
    };
  }
}

export async function verifyAll(
  options?: VerifyOptions,
): Promise<VerifyAllResult> {
  const backupDir = options?.backupDir || '.clawguard/backups';
  const metadataStore = createMetadataStore(getDefaultMetadataIndexPath(backupDir));

  // Get all backups
  const backups = await metadataStore.list();

  const details: VerifyResult[] = [];
  let validCount = 0;
  let invalidCount = 0;

  for (const metadata of backups) {
    const result = await verify(metadata.id, options);
    details.push(result);

    if (result.valid) {
      validCount++;
    } else {
      invalidCount++;
    }
  }

  return {
    total: backups.length,
    valid: validCount,
    invalid: invalidCount,
    details,
  };
}

export async function repair(
  backupId: string,
  options?: VerifyOptions,
): Promise<VerifyResult> {
  const backupDir = options?.backupDir || '.clawguard/backups';
  const metadataStore = createMetadataStore(getDefaultMetadataIndexPath(backupDir));

  // Get backup metadata
  const metadata = await metadataStore.get(backupId);

  if (!metadata) {
    return {
      backupId,
      valid: false,
      message: 'Backup not found',
    };
  }

  // Determine backup file path based on level
  const ext = metadata.level === 'config' ? '.json' : '.tar.gz';
  const backupPath = path.join(backupDir, `${backupId}${ext}`);

  try {
    // Read backup file
    const data = await fs.readFile(backupPath);

    // Recalculate checksum
    const actualChecksum = calculateChecksum(data as Buffer);

    // Update metadata with correct checksum
    await metadataStore.update(backupId, { checksum: actualChecksum });

    return {
      backupId,
      valid: true,
      message: 'Backup repaired: checksum updated',
      checksum: actualChecksum,
    };
  } catch (error) {
    return {
      backupId,
      valid: false,
      message: `Error repairing backup file: ${error}`,
    };
  }
}
