import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { corsMiddleware, errorHandler, notFound } from './middleware/index.js';
import routes from './routes/index.js';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';

const app = new Hono();

// Apply middleware
app.use('*', corsMiddleware);
app.use('*', errorHandler);

// Register routes
app.route('/api', routes);

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'Gateway is running' });
});

// Serve static files from public directory
app.use('*', serveStatic({
  root: path.join(process.cwd(), 'public'),
  index: 'index.html',
}));

// 404 handler
app.notFound(notFound);

export function startServer(port: number = 3000): void {
  console.log(`🚀 ClawGuard Gateway starting on port ${port}...`);
  serve({ fetch: app.fetch, port });
  console.log(`✅ Gateway running at http://localhost:${port}`);
}

export { app };
