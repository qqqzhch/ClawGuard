import { Hono } from 'hono';
import type { ApiResponse, PaginatedResponse, ScheduleItem } from '../types/api.js';

const app = new Hono();

// List all schedules
app.get('/', async (c) => {
  try {
    const response: PaginatedResponse<ScheduleItem> = {
      success: true,
      data: [],
      total: 0,
      page: 1,
      pageSize: 0,
    };

    return c.json(response);
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

// Create/enable schedule
app.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      name: string;
      level: 'config' | 'system' | 'full';
      cron: string;
      retainDays: number;
    }>();

    const response: ApiResponse<ScheduleItem> = {
      success: true,
      data: {
        id: 'mock-schedule-id',
        name: body.name,
        level: body.level,
        cron: body.cron,
        retainDays: body.retainDays,
        enabled: true,
      },
    };

    return c.json(response, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

// Disable schedule
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    return c.json({
      success: true,
      message: `Schedule ${id} disabled`,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

// Update retain days
app.put('/:id/retain-days', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{ retainDays: number }>();

    return c.json({
      success: true,
      message: `Retain days updated to ${body.retainDays}`,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

export default app;
