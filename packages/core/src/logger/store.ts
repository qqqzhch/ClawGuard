import fs from 'node:fs';
import path from 'node:path';
import { ensureDirSync } from 'fs-extra';
import type { LogEntry } from '../types/logger.js';
import { getOpenClawRoot } from '../paths/index.js';

const LOG_DIR = '.clawguard/logs';
const LOG_FILE = 'clawguard.log';
const METADATA_FILE = 'metadata.json';

export class LogStore {
  private logPath: string;
  private metadataPath: string;

  constructor(customRoot?: string) {
    const root = customRoot || getOpenClawRoot();
    this.logPath = path.join(root, LOG_DIR, LOG_FILE);
    this.metadataPath = path.join(root, LOG_DIR, METADATA_FILE);
    ensureDirSync(path.join(root, LOG_DIR));
  }

  /** Append log entry to file */
  append(entry: LogEntry): void {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.logPath, line, 'utf8');
    this.updateMetadata(entry);
  }

  /** Read all log entries */
  readAll(): LogEntry[] {
    if (!fs.existsSync(this.logPath)) {
      return [];
    }

    const content = fs.readFileSync(this.logPath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);

    return lines.map((line) => {
      try {
        return JSON.parse(line) as LogEntry;
      } catch {
        return null;
      }
    }).filter((entry): entry is LogEntry => entry !== null);
  }

  /** Read log entries with pagination */
  readPaginated(offset: number = 0, limit: number = 100): LogEntry[] {
    const all = this.readAll();
    return all.slice(offset, offset + limit);
  }

  /** Filter log entries */
  filter(
    predicate: (entry: LogEntry) => boolean
  ): LogEntry[] {
    return this.readAll().filter(predicate);
  }

  /** Clear all logs */
  clear(): void {
    if (fs.existsSync(this.logPath)) {
      fs.unlinkSync(this.logPath);
    }
    if (fs.existsSync(this.metadataPath)) {
      fs.unlinkSync(this.metadataPath);
    }
  }

  /** Get log file size */
  getSize(): number {
    if (!fs.existsSync(this.logPath)) {
      return 0;
    }
    return fs.statSync(this.logPath).size;
  }

  /** Get metadata */
  getMetadata(): { totalLogs: number; lastLogTime?: string } {
    if (!fs.existsSync(this.metadataPath)) {
      return { totalLogs: 0 };
    }

    try {
      const content = fs.readFileSync(this.metadataPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return { totalLogs: 0 };
    }
  }

  private updateMetadata(entry: LogEntry): void {
    const metadata = this.getMetadata();
    metadata.totalLogs += 1;
    metadata.lastLogTime = entry.timestamp;
    fs.writeFileSync(
      this.metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf8'
    );
  }
}

export function createLogStore(customRoot?: string): LogStore {
  return new LogStore(customRoot);
}
