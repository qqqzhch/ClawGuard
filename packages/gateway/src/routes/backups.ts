import { Hono } from 'hono';
import type { ApiResponse, PaginatedResponse, BackupItem } from '../types/api.js';

const app = new Hono();

// List all backups
app.get('/', async (c) => {
  try {
    const items: BackupItem[] = [];

    const response: PaginatedResponse<BackupItem> = {
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

// Get backup details
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // TODO: Implement when getBackupMetadata is available
    const response: ApiResponse<BackupItem> = {
      success: true,
      data: {
        id,
        name: 'Mock Backup',
        level: 'config',
        timestamp: new Date().toISOString(),
        size: 0,
        encrypted: false,
        path: '/mock/path',
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

// Create backup
app.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      level: 'config' | 'system' | 'full';
      name?: string;
      encrypt?: boolean;
    }>();

    // TODO: Implement when createBackup is available
    const response: ApiResponse<BackupItem> = {
      success: true,
      data: {
        id: 'mock-backup-id',
        name: body.name || 'Unnamed Backup',
        level: body.level,
        timestamp: new Date().toISOString(),
        size: 0,
        encrypted: body.encrypt || false,
        path: '/mock/path',
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

export default app;
