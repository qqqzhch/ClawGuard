export * from './logger.js';
export * from './store.js';
export * from './query.js';

import type { LogEntry } from '../types/logger.js';
import type { LogContext } from '../types/logger.js';
import { logger } from './logger.js';
import { LogLevel } from '../types/logger.js';

/**
 * 记录日志到存储
 */
export async function logToStore(options: {
  level: LogLevel;
  command?: string;
  message: string;
  backupId?: string;
  scheduleId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  success?: boolean;
}): Promise<void> {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: options.level,
    command: options.command || 'unknown',
    message: options.message,
    backupId: options.backupId,
    scheduleId: options.scheduleId,
    duration: options.duration,
    metadata: options.metadata,
    success: options.success !== undefined ? options.success : true,
  };

  const { createLogStore } = await import('./store.js');
  const store = createLogStore();
  store.append(entry);
}

/**
 * 记录带上下文的日志到存储
 */
export async function logWithContext(
  message: string,
  context: LogContext,
  level?: LogLevel
): Promise<void> {
  await logToStore({
    level: level || LogLevel.INFO,
    message,
    command: context.command,
    backupId: context.backupId,
    scheduleId: context.scheduleId,
    duration: context.duration,
    metadata: context.metadata,
    success: context.success,
  });
}
