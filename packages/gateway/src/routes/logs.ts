import { Hono } from 'hono';
import type { ApiResponse, PaginatedResponse, LogItem } from '../types/api.js';
import { createLogStore, createLogQuery } from '@core/clawguard';

const app = new Hono();

// List logs
app.get('/', async (c) => {
  try {
    const query = c.req.query();
    const store = createLogStore();
    const queryEngine = createLogQuery(store);

    const logs = queryEngine.query({
      level: query.level as any,
      command: query.command.comand,
      backupId: query.backupId,
      scheduleId: query.scheduleId,
      limit: query.limit ? parseInt(query.limit) : 100,
      offset: query.offset ? parseInt(query.offset) : 0,
    });

    const items: LogItem[] = logs.map((log) => ({
      timestamp: log.timestamp,
      level: log.level,
      message: log.message,
      command: log.command,
      operation: log.operation,
      backupId: log.backupId,
      scheduleId: log.scheduleId,
      success: log.success,
      error: log.error,
    }));

    const response: PaginatedResponse<LogItem> = {
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

// Get log stats
app.get('/stats', async (c) => {
  try {
    const store = createLogStore();
    const queryEngine = createLogQuery(store);

    const stats = queryEngine.getStats();
    const metadata = store.getMetadata();

    const response: ApiResponse = {
      success: true,
      data: {
        ...stats,
        lastLogTime: metadata.lastLogTime,
      },
    };

    return c.json(response);
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

// Clear logs
app.delete('/', async (c) => {
  try {
    const store = createLogStore();
    store.clear();

    const response: ApiResponse = {
      success: true,
      message: 'Logs cleared successfully',
    };

    return c.json(response);
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

export default app;
