import { Hono } from 'hono';
import type { ApiResponse } from '../types/api.js';
import { restoreBackup } from '@core/clawguard';

const app = new Hono();

// Restore backup
app.post('/:backupId', async (c) => {
  try {
    const { backupId } = c.req.param('backupId');
    const body = await c.req.json<{
      dryRun?: boolean;
      target?: string;
    }>();

    // TODO: Implement when restoreBackup function is available
    const result = await restoreBackup({
      backupId,
      dryRun: body.dryRun || false,
      targetPath: body.target,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Restore completed successfully',
      data: result,
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
    const { backupId } = c.req.param('backupId');

    // TODO: Implement when restoreBackup function is available
    const result = await restoreBackup({
      backupId,
      dryRun: true,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Restore preview generated',
      data: result,
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
