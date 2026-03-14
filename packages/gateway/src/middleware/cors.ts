import { cors } from 'hono/cors';

export const corsMiddleware = cors({
  origin: '*', // Allow all origins for local development
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
});
