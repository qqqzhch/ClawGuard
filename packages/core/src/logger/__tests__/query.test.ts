import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { LogStore, createLogStore } from '../store.js';
import { LogQuery, createLogQuery } from '../query.js';
import type { LogEntry, LogLevel } from '../../types/logger.js';

vi.mock('../paths/index.js', () => ({
  getOpenClawRoot: vi.fn(() => process.cwd()),
}));

describe('LogQuery', () => {
  const testDir = path.join(process.cwd(), 'test-query-logs');
  let store: LogStore;
  let query: LogQuery;

  const mockEntry = (level: LogLevel, message: string, overrides: Partial<LogEntry> = {}): LogEntry => ({
    timestamp: new Date().toISOString(),
    level,
    message,
    success: true,
    ...overrides,
  });

  beforeEach(() => {
    store = createLogStore(testDir);
    query = createLogQuery(store);

    // Add sample logs
    store.append(mockEntry('info', 'Backup started', { command: 'backup' }));
    store.append(mockEntry('warn', 'Disk space low', { command: 'backup' }));
    store.append(mockEntry('error', 'Backup failed', { command: 'backup', success: false }));
    store.append(mockEntry('info', 'Restore started', { command: 'restore' }));
    store.append(mockEntry('info', 'Schedule enabled', { command: 'schedule' }));
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should query all logs', () => {
    const results = query.query();
    expect(results).toHaveLength(5);
  });

  it('should filter by level', () => {
    const results = query.query({ level: 'error' });
    expect(results).toHaveLength(1);
    expect(results[0].message).toBe('Backup failed');
  });

  it('should filter by command', () => {
    const results = query.query({ command: 'backup' });
    expect(results).toHaveLength(3);
  });

  it('should filter by backupId', () => {
    store.append(mockEntry('info', 'Backup completed', { backupId: 'abc123' }));

    const results = query.query({ backupId: 'abc123' });
    expect(results).toHaveLength(1);
  });

  it('should apply pagination', () => {
    const results = query.query({ offset: 1, limit: 2 });
    expect(results).toHaveLength(2);
  });

  it('should get stats', () => {
    const stats = query.getStats();

    expect(stats.total).toBe(5);
    expect(stats.byLevel.info).toBe(3);
    expect(stats.byLevel.warn).toBe(1);
    expect(stats.byLevel.error).toBe(1);
    expect(stats.successRate).toBeCloseTo(0.8);
  });

  it('should get recent logs', () => {
    const recent = query.recent(3);
    expect(recent).toHaveLength(3);
  });

  it('should get failures', () => {
    const failures = query.failures();
    expect(failures).toHaveLength(1);
  });

  it('should search logs by keyword', () => {
    const results = query.search('backup');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((entry) => {
      expect(entry.message.toLowerCase()).toContain('backup');
    });
  });
});
