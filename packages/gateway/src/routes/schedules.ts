import { Hono } from 'hono';
import type { ApiResponse, PaginatedResponse, ScheduleItem } from '../types/api.js';
import {
  listSchedules,
  enableSchedule,
  disableSchedule,
  setRetainDays
} from '@core/clawguard';

const app = new Hono();

// List all schedules
app.get('/', async (c) => {
  try {
    const schedules = listSchedules();

    const items: ScheduleItem[] = schedules.map((schedule) => ({
      id: schedule.id,
      name: schedule.name,
      level: schedule.level,
      cron: schedule.cron,
      retainDays: schedule.retainDays,
      enabled: schedule.enabled,
      lastRun: schedule.lastRun,
      nextRun: schedule.nextRun,
    }));

    const response: PaginatedResponse<ScheduleItem> = {
      success: true,
      data: items,
      total: items.length,
      page: 1,
      pageSize: items.length,
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

    const schedule = enableSchedule({
      name: body.name,
      level: body.level,
      cron: body.cron,
      retainDays: body.retainDays,
    });

    const response: ApiResponse<ScheduleItem> = {
      success: true,
      data: {
        id: schedule.id,
        name: schedule.name,
        level: schedule.level,
        cron: schedule.cron,
        retainDays: schedule.retainDays,
        enabled: schedule.enabled,
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
    disableSchedule({ id });

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

    setRetainDays({ id, retainDays: body.retainDays });

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
