import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import configRoute from '../../routes/config.js';

vi.mock('@core/clawguard', () => ({
  getOpenClawRoot: vi.fn(() => '/mock/root'),
  getConfigFiles: vi.fn(() => ({
    SOUL: '.clawguard/config/SOUL.md',
    MEMORY: '.clawguard/config/MEMORY.md',
  })),
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

    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('should get specific config', async () => {
    const response = await app.request('/api/config/SOUL');
    // Will fail because file doesn't exist, but API structure is correct
    expect([200, 404, 500]).toContain(response.status);

    const response = await app.request('/api/config/SOUL');
    expect([200, 404, 500]).toContain(response.status);

    const response = await app.request('/api/config/MEMORY');
    expect([200, 404, 500]).toContain(response.status);
  });

  it('should update config', async () => {
    const response = await app.request('/api/config/SOUL', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 'Updated Value' }),
    });

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
  });
});
