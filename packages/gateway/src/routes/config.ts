import { Hono } from 'hono';
import type { ApiResponse, ConfigEntry } from '../types/api.js';
import fs from 'node:fs';
import path from 'node:path';

// Mock implementations for development - will connect to core when integrated
function getOpenClawRoot(): string {
  return process.cwd();
}

function getConfigFiles(): string[] {
  return [
    'config.json',
    'settings.json',
  ];
}

const app = new Hono();

// List all config files
app.get('/', async (c) => {
  try {
    const root = getOpenClawRoot();
    const configFiles = getConfigFiles();

    const items: ConfigEntry[] = configFiles.map((filePath: string) => {
      const fullPath = path.join(root, filePath);
      let value: unknown = null;
      let type: ConfigEntry['type'] = 'string';
      const key = path.basename(filePath, path.extname(filePath));

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

    // Find file that matches to key (basename without extension)
    const matchedFile = configFiles.find((f: string) => path.basename(f, path.extname(f)) === key);

    if (!matchedFile) {
      return c.json({
        success: false,
        error: 'Config file not found',
      }, 404);
    }

    const fullPath = path.join(root, matchedFile);
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

    // Find file that matches to key
    const matchedFile = configFiles.find((f: string) => path.basename(f, path.extname(f)) === key);

    if (!matchedFile) {
      return c.json({
        success: false,
        error: 'Config file not found',
      }, 404);
    }

    const fullPath = path.join(root, matchedFile);
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
