import type { LogEntry, LogQueryOptions, LogStats, LogLevel } from '../types/logger.js';
import { LogStore } from './store.js';

export class LogQuery {
  private store: LogStore;

  constructor(store: LogStore) {
    this.store = store;
  }

  /** Query logs with options */
  query(options: LogQueryOptions = {}): LogEntry[] {
    let results = this.store.readAll();

    // Filter by level
    if (options.level) {
      results = results.filter((entry) => entry.level === options.level);
    }

    // Filter by command
    if (options.command) {
      results = results.filter((entry) => entry.command === options.command);
    }

    // Filter by backupId
    if (options.backupId) {
      results = results.filter((entry) => entry.backupId === options.backupId);
    }

    // Filter by scheduleId
    if (options.scheduleId) {
      results = results.filter((entry) => entry.scheduleId === options.scheduleId);
    }

    // Filter by date range
    if (options.startDate) {
      const start = new Date(options.startDate).getTime();
      results = results.filter((entry) => new Date(entry.timestamp).getTime() >= start);
    }

    if (options.endDate) {
      const end = new Date(options.endDate).getTime();
      results = results.filter((entry) => new Date(entry.timestamp).getTime() <= end);
    }

    // Pagination
    if (options.offset) {
      results = results.slice(options.offset);
    }

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /** Get log statistics */
  getStats(): LogStats {
    const all = this.store.readAll();

    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    let successCount = 0;

    for (const entry of all) {
      byLevel[entry.level]++;
      if (entry.success) {
        successCount++;
      }
    }

    return {
      total: all.length,
      byLevel,
      successRate: all.length > 0 ? successCount / all.length : 0,
    };
  }

  /** Get recent logs */
  recent(count: number = 10): LogEntry[] {
    const all = this.store.readAll();
    return all.slice(-count);
  }

  /** Get failed operations */
  failures(): LogEntry[] {
    return this.store.filter((entry) => entry.level === 'error' || !entry.success);
  }

  /** Search logs by message */
  search(keyword: string): LogEntry[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.store.filter((entry) =>
      entry.message.toLowerCase().includes(lowerKeyword)
    );
  }
}

export function createLogQuery(store: LogStore): LogQuery {
  return new LogQuery(store);
}
