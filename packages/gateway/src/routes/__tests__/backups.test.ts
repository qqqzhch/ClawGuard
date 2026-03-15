import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import backupsRoute from '../../routes/backups.js';

vi.mock('@core/clawguard', () => ({
  listBackups: vi.fn(() => Promise.resolve([])),
  getBackupMetadata: vi.fn(() => Promise.resolve(null)),
  createBackup: vi.fn(() => Promise.resolve({
    id: 'test-id',
    name: 'Test Backup',
    level: 'config',
    timestamp: { timestamp: new Date().toISOString() },
    encrypted: false,
    path: '/test/path',
  })),
}));

describe('Backups API', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/api/backups', backupsRoute);
  });

  it('should list all backups', async () => {
    const response = await app.request('/api/backups');
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('should get backup details', async () => {
    const response = await app.request('/api/backups/test-id');
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('should create backup', async () => {
    const response = await app.request('/api/backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 'config' }),
    });

    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.success).toBe(true);
  });
});
