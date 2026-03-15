import fs from 'fs/promises';
import fsExtra from 'fs-extra';
import path from 'path';
import * as tar from 'tar';
import { createMetadataStore, getDefaultMetadataIndexPath } from '../metadata-store/index.js';
import { getOpenClawRoot, getWorkspacePath } from '../paths/index.js';

export interface RestoreOptions {
  backupId: string;
  backupDir?: string;
  targetPath?: string;
  dryRun?: boolean;
}

export interface RestoreResult {
  filesRestored: number;
  duration: number;
  backupId: string;
  backupName: string;
  targetPath: string;
  skipped?: string[];
  errors?: Array<{ file: string; error: string }>;
}

export async function restoreBackupImpl(options: RestoreOptions): Promise<RestoreResult> {
  const startTime = Date.now();
  const backupDir = options.backupDir || '.clawguard/backups';
  const metadataStore = createMetadataStore(getDefaultMetadataIndexPath(backupDir));
  const metadata = await metadataStore.get(options.backupId);
  if (!metadata) {
    throw new Error(`Backup not found: ${options.backupId}`);
  }
  const targetPath = options.targetPath || getOpenClawRoot();
  const result: RestoreResult = {
    filesRestored: 0,
    duration: 0,
    backupId: metadata.id,
    backupName: metadata.name,
    targetPath,
  };

  if (options.dryRun) {
    console.log(`[DRY RUN] Would restore backup: ${metadata.name}`);
    console.log(`[DRY RUN] Backup level: ${metadata.level}`);
    console.log(`[DRY RUN] Target path: ${targetPath}`);
    result.duration = Date.now() - startTime;
    return result;
  }

  console.log(`Restoring backup: ${metadata.name} (${metadata.level})`);
  console.log(`Target path: ${targetPath}`);

  const skipped: string[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  try {
    switch (metadata.level) {
      case 'config':
        result.filesRestored = await restoreConfigBackup(options.backupId, backupDir, targetPath, skipped, errors);
        break;
      case 'system':
        result.filesRestored = await restoreTarBackup(options.backupId, backupDir, targetPath, skipped, errors);
        break;
      case 'full':
        result.filesRestored = await restoreTarBackup(options.backupId, backupDir, getWorkspacePath(), skipped, errors);
        break;
      default:
        throw new Error(`Unknown backup level: ${metadata.level}`);
    }

    result.duration = Date.now() - startTime;
    result.skipped = skipped.length > 0 ? skipped : undefined;
    result.errors = errors.length > 0 ? errors : undefined;

    console.log(`Restore completed: ${result.filesRestored} files restored in ${result.duration}ms`);
    if (skipped.length > 0) {
      console.log(`Skipped ${skipped.length} files (already exist or cannot overwrite)`);
    }
    if (errors.length > 0) {
      console.warn(`${errors.length} errors occurred during restore`);
      for (const error of errors) {
        console.warn(`  - ${error.file}: ${error.error}`);
      }
    }

    return result;
  } catch (error) {
    throw error;
  }
}

async function restoreConfigBackup(backupId: string, backupDir: string, targetPath: string, skipped: string[], errors: Array<{ file: string; error: string }>): Promise<number> {
  const backupPath = path.join(backupDir, `${backupId}.json`);
  const data = await fs.readFile(backupPath, 'utf-8');
  const backupData = JSON.parse(data);
  await fsExtra.ensureDir(targetPath);
  let restoredCount = 0;

  for (const [filePath, content] of Object.entries(backupData)) {
    try {
      const exists = await fsExtra.pathExists(filePath);
      if (exists) {
        const existingContent = await fs.readFile(filePath, 'utf-8');
        if (existingContent === content) {
          skipped.push(filePath);
          continue;
        }
        await createBackupFile(filePath);
      }
      await fsExtra.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, String(content), 'utf-8');
      restoredCount++;
      console.log(`  Restored: ${filePath}`);
    } catch (error) {
      errors.push({
        file: filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`  Failed to restore ${filePath}:`, error);
    }
  }

  return restoredCount;
}

async function restoreTarBackup(backupId: string, backupDir: string, targetPath: string, skipped: string[], errors: Array<{ file: string; error: string }>): Promise<number> {
  const backupPath = path.join(backupDir, `${backupId}.tar.gz`);
  const backupData = await fs.readFile(backupPath);
  await fsExtra.ensureDir(targetPath);

  try {
    await tar.extract({
      gzip: true,
      cwd: targetPath,
    }, [backupPath]);

    const entries = await tar.list({ gzip: true }, [backupPath]);
    return entries.length;
  } catch (error) {
    errors.push({
      file: backupPath,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function createBackupFile(filePath: string): Promise<void> {
  const backupPath = `${filePath}.clawguard.backup`;
  try {
    if (await fsExtra.pathExists(filePath)) {
      await fsExtra.copy(filePath, backupPath);
      console.log(`  Backed up existing file to: ${backupPath}`);
    }
  } catch {
    // Ignore errors when creating backup file
  }
}

export async function validateBackup(backupId: string, backupDir?: string): Promise<{ valid: boolean; reason?: string; metadata?: any }> {
  const dir = backupDir || '.clawguard/backups';
  const metadataStore = createMetadataStore(getDefaultMetadataIndexPath(dir));
  const metadata = await metadataStore.get(backupId);
  if (!metadata) {
    return { valid: false, reason: 'Backup metadata not found' };
  }
  const ext = metadata.level === 'config' ? '.json' : '.tar.gz';
  const backupPath = path.join(dir, `${backupId}${ext}`);
  if (!(await fsExtra.pathExists(backupPath))) {
    return { valid: false, reason: 'Backup file not found', metadata };
  }
  if (metadata.size === 0) {
    return { valid: false, reason: 'Backup file is empty', metadata };
  }
  return { valid: true, metadata };
}

export async function previewRestore(backupId: string, backupDir?: string): Promise<{ metadata?: any; files?: string[]; totalSize?: number }> {
  const validation = await validateBackup(backupId, backupDir);
  if (!validation.valid || !validation.metadata) {
    return { metadata: validation.metadata };
  }
  const dir = backupDir || '.clawguard/backups';

  if (validation.metadata?.level === 'config') {
    const backupPath = path.join(dir, `${backupId}.json`);
    const data = await fs.readFile(backupPath, 'utf-8');
    const backupData = JSON.parse(data);
    return {
      metadata: validation.metadata,
      files: Object.keys(backupData),
      totalSize: validation.metadata?.size,
    };
  } else {
    const backupPath = path.join(dir, `${backupId}.tar.gz`);
    const backupData = await fs.readFile(backupPath);
    const entries = await tar.list({ gzip: true }, [backupPath]);
    return {
      metadata: validation.metadata,
      files: entries.map((e: any) => e.path),
      totalSize: backupData.length,
    };
  }
}

export async function restoreBackup(options: RestoreOptions): Promise<RestoreResult> {
  return restoreBackupImpl(options);
}
