import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { LogStore, createLogStore } from '../store.js';
import type { LogEntry, LogLevel } from '../../types/logger.js';

vi.mock('../paths/index.js', () => ({
  getOpenClawRoot: vi.fn(() => process.cwd()),
}));

describe('LogStore', () => {
  const testDir = path.join(process.cwd(), 'test-logs');
  let store: LogStore;

  beforeEach(() => {
    store = createLogStore(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  const mockEntry = (level: LogLevel, message: string): LogEntry => ({
    timestamp: new Date().toISOString(),
    level,
    message,
    success: true,
  });

  it('should create log directory', () => {
    expect(fs.existsSync(testDir)).toBe(true);
  });

  it('should append log entry', () => {
    const entry = mockEntry('info', 'Test message');
    store.append(entry);

    const logs = store.readAll();
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('Test message');
  });

  it('should read all log entries', () => {
    store.append(mockEntry('info', 'Message 1'));
    store.append(mockEntry('warn', 'Message 2'));

    const logs = store.readAll();
    expect(logs).toHaveLength(2);
  });

  it('should read paginated entries', () => {
    for (let i = 0; i < 5; i++) {
      store.append(mockEntry('info', `Message ${i}`));
    }

    const page1 = store.readPaginated(0, 2);
    expect(page1).toHaveLength(2);

    const page2 = store.readPaginated(2, 2);
    expect(page2).toHaveLength(2);
  });

  it('should filter log entries', () => {
    store.append(mockEntry('info', 'Info message'));
    store.append(mockEntry('error', 'Error message'));
    store.append(mockEntry('warn', 'Warning message'));

    const errors = store.filter((entry) => entry.level === 'error');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Error message');
  });

  it('should clear all logs', () => {
    store.append(mockEntry('info', 'Test'));
    store.clear();

    const logs = store.readAll();
    expect(logs).toHaveLength(0);
  });

  it('should get log file size', () => {
    store.append(mockEntry('info', 'Test'));
    const size = store.getSize();

    expect(size).toBeGreaterThan(0);
  });

  it('should update metadata', () => {
    const entry = { ...mockEntry('info', 'Test'), timestamp: '2024-01-01T00:00:00Z' };
    store.append(entry);

    const metadata = store.getMetadata();
    expect(metadata.totalLogs).toBe(1);
    expect(metadata.lastLogTime).toBe('2024-01-01T00:00:00Z');
  });
});
