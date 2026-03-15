import fs from 'fs/promises';
import path from 'path';
import type { BackupMetadata, BackupLevel } from '../types/backup.js';

export interface MetadataStore {
  add(metadata: BackupMetadata): Promise<void>;
  get(id: string): Promise<BackupMetadata | null>;
  list(options?: { level?: BackupLevel }): Promise<BackupMetadata[]>;
  update(id: string, data: Partial<BackupMetadata>): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

interface MetadataIndex {
  backups: BackupMetadata[];
}

export function createMetadataStore(indexPath: string): MetadataStore {
  const dir = path.dirname(indexPath);

  async function loadIndex(): Promise<MetadataIndex> {
    try {
      const content = await fs.readFile(indexPath, 'utf-8');
      const result = JSON.parse(content);
      // Validate the result structure
      if (!result || !Array.isArray(result.backups)) {
        throw new Error('Invalid metadata index format');
      }
      return result;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return { backups: [] };
      }
      // If the file exists but is corrupted, log warning and return empty
      console.warn(`Warning: Metadata index file corrupted at ${indexPath}, using empty index`);
      return { backups: [] };
    }
  }

  async function saveIndex(index: MetadataIndex): Promise<void> {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  }

  return {
    async add(metadata: BackupMetadata): Promise<void> {
      const index = await loadIndex();

      // Remove existing entry with same id (update case)
      index.backups = index.backups.filter(b => b.id !== metadata.id);
      index.backups.push(metadata);

      await saveIndex(index);
    },

    async get(id: string): Promise<BackupMetadata | null> {
      const index = await loadIndex();
      return index.backups.find(b => b.id === id) || null;
    },

    async list(options?: { level?: BackupLevel }): Promise<BackupMetadata[]> {
      const index = await loadIndex();
      let result = [...index.backups];

      // Sort by timestamp descending (newest first)
      result.sort((a, b) => b.timestamp - a.timestamp);

      // Filter by level if specified
      if (options?.level) {
        result = result.filter(b => b.level === options.level);
      }

      return result;
    },

    async update(id: string, data: Partial<BackupMetadata>): Promise<void> {
      const index = await loadIndex();
      const existing = index.backups.find(b => b.id === id);
      if (existing) {
        Object.assign(existing, data);
        await saveIndex(index);
      }
    },

    async delete(id: string): Promise<void> {
      const index = await loadIndex();
      index.backups = index.backups.filter(b => b.id !== id);
      await saveIndex(index);
    },

    async clear(): Promise<void> {
      try {
        await saveIndex({ backups: [] });
      } catch (error) {
        // If saveIndex fails (e.g., due to corrupted existing file),
        // try to delete the file and recreate it
        try {
          await fs.unlink(indexPath);
        } catch {
          // Ignore delete errors
        }
        await saveIndex({ backups: [] });
      }
    },
  };
}

export function getDefaultMetadataIndexPath(backupDir: string): string {
  return path.join(backupDir, 'metadata-index.json');
}
