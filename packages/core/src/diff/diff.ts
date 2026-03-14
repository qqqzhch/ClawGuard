import fs from 'fs/promises';
import path from 'path';
import { createMetadataStore, getDefaultMetadataIndexPath } from '../metadata-store/index.js';
import type { BackupMetadata } from '../types/backup.js';

export interface DiffOptions {
  backupDir?: string;
  ignoreFields?: string[];
}

export interface FieldChange {
  field: string;
  type: 'added' | 'modified' | 'deleted';
  oldValue?: any;
  newValue?: any;
  backupId?: string;
}

export interface DiffResult {
  changes: FieldChange[];
  summary: string;
  commonFields: string[];
  differentFields: string[];
}

export async function diff(
  backupId1: string,
  backupId2: string,
  options?: DiffOptions,
): Promise<DiffResult> {
  const backupDir = options?.backupDir || '.clawguard/backups';
  const metadataIndexPath = getDefaultMetadataIndexPath(backupDir);
  const metadataStore = createMetadataStore(metadataIndexPath);

  // Get both backups metadata
  const metadata1 = await metadataStore.get(backupId1);
  const metadata2 = await metadataStore.get(backupId2);

  if (!metadata1) {
    throw new Error(`Backup not found: ${backupId1}`);
  }

  if (!metadata2) {
    throw new Error(`Backup not found: ${backupId2}`);
  }

  // Validate backups are comparable
  if (metadata1.level !== metadata2.level) {
    throw new Error('Cannot compare backups of different levels');
  }

  const changes: FieldChange[] = [];
  const ignoreSet = new Set(options?.ignoreFields || []);

  // Determine backup file extension
  const ext = metadata1.level === 'config' ? '.json' : '.tar.gz';

  // Load backup data for comparison
  const backup1Path = path.join(backupDir, `${backupId1}${ext}`);
  const backup2Path = path.join(backupDir, `${backupId2}${ext}`);

  const data1 = await fs.readFile(backup1Path);
  const data2 = await fs.readFile(backup2Path);

  let config1: Record<string, unknown> = {};
  let config2: Record<string, unknown> = {};

  // For config backups, parse JSON
  if (metadata1.level === 'config') {
    config1 = JSON.parse(data1.toString('utf-8'));
    config2 = JSON.parse(data2.toString('utf-8'));
  }

  // Compare backup files
  if (metadata1.level !== 'config') {
    // For tar.gz, just check file count and size
    const sizeDiff = Math.abs(metadata1.size - metadata2.size);
    if (sizeDiff > 0) {
      changes.push({
        field: 'size',
        type: sizeDiff > 0 ? 'added' : 'modified',
        oldValue: metadata2.size,
        newValue: metadata1.size,
        backupId: backupId2,
      });
    }
    const countDiff = metadata1.fileCount - metadata2.fileCount;
    if (countDiff !== 0) {
      changes.push({
        field: 'fileCount',
        type: countDiff > 0 ? 'added' : 'modified',
        oldValue: metadata2.fileCount,
        newValue: metadata1.fileCount,
        backupId: backupId2,
      });
    }
  }

  // For config backups, compare JSON fields
  if (metadata1.level === 'config' && config1 && config2) {
    const allFields = new Set<string>();
    for (const key in config1) {
      if (ignoreSet.has(key)) continue;
      allFields.add(key);
    }
    for (const key in config2) {
      if (ignoreSet.has(key)) continue;
      allFields.add(key);
    }

    // Compare each field
    for (const field of allFields) {
      // Skip metadata fields
      if (field === 'level' || field === 'name' || field === 'encrypted') {
        continue;
      }

      const hasIn1 = config1.hasOwnProperty(field);
      const hasIn2 = config2.hasOwnProperty(field);

      if (!hasIn1 && hasIn2) {
        // Added field
        changes.push({
          field,
          type: 'added',
          newValue: config2[field],
          backupId: backupId2,
        });
      } else if (hasIn1 && !hasIn2) {
        // Deleted field
        changes.push({
          field,
          type: 'deleted',
          oldValue: config1[field],
          backupId: backupId1,
        });
      } else if (hasIn1 && hasIn2) {
        // Compare values
        const val1 = config1[field];
        const val2 = config2[field];

        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          changes.push({
            field,
            type: 'modified',
            oldValue: val1,
            newValue: val2,
            backupId: backupId2,
          });
        }
      }
    }
  }

  // Count different fields
  const differentFields = Array.from(
    new Set(changes.filter(c => c.type !== 'deleted').map(c => c.field))
  );

  // Build summary
  const addedFields = changes.filter(c => c.type === 'added').map(c => c.field);
  const modifiedFields = changes.filter(c => c.type === 'modified').map(c => c.field);
  const deletedFields = changes.filter(c => c.type === 'deleted').map(c => c.field);

  const summaryParts: string[] = [];
  if (addedFields.length > 0) {
    summaryParts.push(`Added ${addedFields.join(', ')}`);
  }
  if (modifiedFields.length > 0) {
    summaryParts.push(`Modified ${modifiedFields.join(', ')}`);
  }
  if (deletedFields.length > 0) {
    summaryParts.push(`Deleted ${deletedFields.join(', ')}`);
  }

  const summary = summaryParts.length > 0
    ? summaryParts.join('; ')
    : 'No changes detected';

  // Get common fields (present in both with same values)
  const commonFields: string[] = [];
  if (metadata1.level === 'config' && config1 && config2) {
    for (const key in config1) {
      if (ignoreSet.has(key)) continue;
      if (key === 'level' || key === 'name' || key === 'encrypted') continue;
      if (config2.hasOwnProperty(key) &&
          JSON.stringify(config1[key]) === JSON.stringify(config2[key])) {
        commonFields.push(key);
      }
    }
  }

  return {
    changes,
    summary,
    commonFields,
    differentFields,
  };
}
