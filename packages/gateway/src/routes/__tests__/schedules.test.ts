import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import schedulesRoute from '../../routes/schedules.js';

vi.mock('@core/clawguard', () => ({
  listSchedules: vi.fn(() => []),
  enableSchedule: vi.fn(() => ({ id: '1', name: 'Test', level: 'config', cron: '0 0 * * *', retainDays: 7, enabled: true })),
  disableSchedule: vi.fn(),
  setRetainDays: vi.fn(),
}));

describe('Schedules API', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/api/schedules', schedulesRoute);
  });

  it('should list schedules', async () => {
    const response = await app.request('/api/schedules');
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('should create schedule', async () => {
    const response = await app.request('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test',
        level: 'config',
        cron: '0 0 * * *',
        retainDays: 7,
      }),
    });

    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('should disable schedule', async () => {
    const response = await app.request('/api/schedules/1', {
      method: 'DELETE',
    });

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('should update retain days', async () => {
    const response = await app.request('/api/schedules/1/retain-days', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retainDays: 30 }),
    });

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
  });
});
