import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import logsRoute from '../../routes/logs.js';

vi.mock('@core/clawguard', () => ({
  createLogStore: vi.fn(() => ({
    clear: vi.fn(),
    getMetadata: vi.fn(() => ({ totalLogs: 0, lastLogTime: null })),
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

describe('Logs API', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/api/logs', logsRoute);
  });

  it('should list logs', async () => {
    const response = await app.request('/api/logs');
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('should get log stats', async () => {
    const response = await app.request('/api/logs/stats');
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('should clear logs', async () => {
    const response = await app.request('/api/logs', {
      method: 'DELETE',
    });

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
  });
});
