import { Hono } from 'hono';
import type { ApiResponse, ConfigEntry } from '../types/api.js';
import fs from 'node:fs';
import path from 'node:path';
import { getOpenClawRoot, getConfigFiles } from '@core/clawguard';

const app = new Hono();

// List all config files
app.get('/', async (c) => {
  try {
    const root = getOpenClawRoot();
    const configFiles = getConfigFiles();

    const items: ConfigEntry[] = Object.entries(configFiles).map(([key, filePath]) => {
      const fullPath = path.join(root, filePath);
      let value: unknown = null;
      let type: ConfigEntry['type'] = 'string';

      try {
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          value = JSON.parse(content);
          type = typeof value === 'object' ? 'object' : 'string';
        }
      } catch {
        // Parse error, keep as string
      }

      return {
        key,
        value,
        type,
      };
    });

    const response: ApiResponse<ConfigEntry[]> = {
      success: true,
      data: items,
    };

    return c.json(response);
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

// Get specific config
app.get('/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const root = getOpenClawRoot();
    const configFiles = getConfigFiles();

    if (!configFiles[key]) {
      return c.json({
        success: false,
        error: 'Config key not found',
      }, 404);
    }

    const fullPath = path.join(root, configFiles[key]);
    if (!fs.existsSync(fullPath)) {
      return c.json({
        success: false,
        error: 'Config file not found',
      }, 404);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const value = JSON.parse(content);

    const response: ApiResponse = {
      success: true,
      data: { key, value },
    };

    return c.json(response);
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

// Update config
app.put('/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const body = await c.req.json<{ value: unknown }>();

    const root = getOpenClawRoot();
    const configFiles = getConfigFiles();

    if (!configFiles[key]) {
      return c.json({
        success: false,
        error: 'Config key not found',
      }, 404);
    }

    const fullPath = path.join(root, configFiles[key]);
    const content = JSON.stringify(body.value, null, 2);
    fs.writeFileSync(fullPath, content, 'utf-8');

    const response: ApiResponse = {
      success: true,
      message: `Config ${key} updated successfully`,
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
