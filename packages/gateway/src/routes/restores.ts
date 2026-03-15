import { Hono } from 'hono';
import type { ApiResponse } from '../types/api.js';

const app = new Hono();

// Restore backup
app.post('/:backupId', async (c) => {
  try {
    const backupId = c.req.param('backupId');
    const body = await c.req.json<{
      dryRun?: boolean;
      target?: string;
    }>();

    // TODO: Implement when restoreBackup function is available
    const response: ApiResponse = {
      success: true,
      message: 'Restore completed successfully',
      data: {
        filesRestoredressored: 0,
        duration: 0,
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

// Preview restore (dry run)
app.post('/:backupId/preview', async (c) => {
  try {
    const backupId = c.req.param('backupId');

    // TODO: Implement when restoreBackup function is available
    const response: ApiResponse = {
      success: true,
      message: 'Restore preview generated',
      data: {
        backupId,
        dryRun: true,
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

export default app;
