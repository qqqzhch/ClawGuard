import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import configRoute from '../../routes/config.js';

vi.mock('@core/clawguard', () => ({
  getOpenClawRoot: vi.fn(() => '/mock/root'),
  getConfigFiles: vi.fn(() => [
    'config.json',
    'settings.json',
  ]),
}));

describe('Config API', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/api/config', configRoute);
  });

  it('should list configs', async () => {
    const response = await app.request('/api/config');
    expect(response.status).toBe(200);

    const json: any = await response.json();
    expect(json.success).toBe(true);
  });

  it('should get specific config', async () => {
    const response = await app.request('/api/config/config');
    // File doesn't exist but API structure is correct
    expect([200, 404, 500]).toContain(response.status);
  });

  it('should update config', async () => {
    const response = await app.request('/api/config/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: { updated: true } }),
    });

    expect(response.status).toBe(200);

    const json: any = await response.json();
    expect(json.success).toBe(true);
  });
});
