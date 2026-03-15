import { Hono } from 'hono';
import type { ApiResponse, PaginatedResponse, LogItem } from '../types/api.js';

// Mock implementations for development - will connect to core when integrated
function createLogStore() {
  return {
    clear: () => {},
    getMetadata: () => ({ totalLogs: 0, lastLogTime: null }),
  };
}

function createLog() {
  return {
    query: () => [],
    getStats: () => ({
      total: 0,
      byLevel: { debug: 0, info: 0, warn: 0, error: 0 },
      successRate: 0,
    }),
  };
}

function createLogQuery(store: any) {
  return {
    query: (params: any) => [],
    getStats: () => ({
      total: 0,
      byLevel: { debug: 0, info: 0, warn: 0, error: 0 },
      successRate: 0,
    }),
  };
}

const app = new Hono();

// List logs
app.get('/', async (c) => {
  try {
    const query = c.req.query();
    const store = createLogStore();
    const queryEngine = createLogQuery(store);

    const logs = queryEngine.query({
      level: query.level as any,
      command: query.command as any,
      backupId: query.backupId as any,
      scheduleId: query.scheduleId as any,
      limit: query.limit ? parseInt(query.limit) : 100,
      offset: query.offset ? parseInt(query.offset) : 0,
    });

    const items: LogItem[] = logs.map((log) => ({
      timestamp: log.timestamp as any,
      level: log.level as any,
      message: log.message as any,
      command: log.command as any,
      operation: log.operation as any,
      backupId: log.backupId as any,
      scheduleId: log.scheduleId as any,
      success: log.success as any,
      error: log.error as any,
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
