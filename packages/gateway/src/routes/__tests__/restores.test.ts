import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import restoresRoute from '../../routes/restores.js';

vi.mock('@core/clawguard', () => ({
  restoreBackup: vi.fn(() => Promise.resolve({
    filesRestored: 10,
    duration: 1000,
  })),
}));

describe('Restores API', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/api/restores', restoresRoute);
  });

  it('should restore backup', async () => {
    const response = await app.request('/api/restores/test-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('should preview restore', async () => {
    const response = await app.request('/api/restores/test-id/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
  });
});
