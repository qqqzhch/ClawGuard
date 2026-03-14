import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { listLogsCommand, logsStatsCommand, logsClearCommand } from '../logs.js';

vi.mock('@core/clawguard', () => ({
  createLogStore: vi.fn(() => ({
    append: vi.fn(),
    readAll: vi.fn(() => []),
    filter: vi.fn(() => []),
    clear: vi.fn(),
    getSize: vi.fn(() => 0),
    getMetadata: vi.fn(() => ({ totalLogs: 0 })),
  })),
  createLogQuery: vi.fn(() => ({
    query: vi.fn(() => []),
    getStats: vi.fn(() => ({
      total: 0,
      byLevel: { debug: 0, info: 0, warn: 0, error: 0 },
      successRate: 0,
    })),
  })),
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Logs Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list logs successfully', async () => {
    await expect(listLogsCommand()).resolves.not.toThrow();
  });

  it('should get log stats successfully', async () => {
    await expect(logsStatsCommand()).resolves.not.toThrow();
  });

  it('should clear logs successfully', async () => {
    await expect(logsClearCommand()).resolves.not.toThrow();
  });
});
