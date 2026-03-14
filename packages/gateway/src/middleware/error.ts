import type { Context, Next } from 'hono';
import type { ErrorResponse } from '../types/api.js';

export async function errorHandler(c: Context, next: Next): Promise<Response> {
  try {
    await next();
    return c.json({ success: true });
  } catch (error) {
    const err = error as Error;
    const response: ErrorResponse = {
      success: false,
      error: err.message,
    };

    if ((error as any).code) {
      response.code = (error as any).code;
    }

    return c.json(response, 500);
  }
}

export function notFound(c: Context): Response {
  const response: ErrorResponse = {
    success: false,
    error: `Route ${c.req.method} ${c.req.path} not found`,
    code: 'NOT_FOUND',
  };
  return c.json(response, 404);
}
