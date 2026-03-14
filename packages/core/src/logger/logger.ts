import pino from 'pino';
import path from 'node:path';
import { ensureDirSync } from 'fs-extra';
import type { LogLevel } from '../types/logger.js';
import { getOpenClawRoot } from '../paths/index.js';

const LOG_DIR = path.join('.clawguard', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'clawguard.log');

// Ensure log directory exists
try {
  const root = getOpenClawRoot();
  ensureDirSync(path.join(root, LOG_DIR));
} catch {
  // Silent fail if OpenClaw root not found
}

export const logger = pino({
  level: 'info',
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
      {
        target: 'pino/file',
        options: {
          destination: LOG_FILE,
          mkdir: true,
        },
      },
    ],
  },
});

export interface LogContext {
  command?: string;
  operation?: string;
  backupId?: string;
  scheduleId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export function logInfo(message: string, context?: LogContext): void {
  logger.info({ ...context }, message);
}

export function logWarn(message: string, context?: LogContext): void {
  logger.warn({ ...context }, message);
}

export function logError(message: string, error?: Error, context?: LogContext): void {
  logger.error(
    {
      ...context,
      error: error?.message,
      stack: error?.stack,
    },
    message
  );
}

export function logDebug(message: string, context?: LogContext): void {
  logger.debug({ ...context }, message);
}

export function logSuccess(message: string, context?: LogContext): void {
  logger.info({ ...context, success: true }, message);
}
