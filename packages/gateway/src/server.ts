import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { corsMiddleware, errorHandler, notFound } from './middleware/index.js';
import routes from './routes/index.js';

const app = new Hono();

// Apply middleware
app.use('*', corsMiddleware);
app.use('*', errorHandler);

// Register routes
app.route('/api', routes);

// 404 handler
app.notFound(notFound);

export function startServer(port: number = 3000): void {
  console.log(`🚀 ClawGuard Gateway starting on port ${port}...`);
  serve({ fetch: app.fetch, port });
  console.log(`✅ Gateway running at http://localhost:${port}`);
}

export { app };
