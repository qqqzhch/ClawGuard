import { logger } from '../utils/logger.js';
import { createLogStore, createLogQuery } from '@core/clawguard';
import type { LogLevel } from '@core/clawguard';

export interface LogsListOptions {
  level?: LogLevel;
  command?: string;
  backupId?: string;
  scheduleId?: string;
  limit?: number;
  offset?: number;
}

export async function listLogsCommand(options: LogsListOptions = {}): Promise<void> {
  try {
    const store = createLogStore();
    const query = createLogQuery(store);

    const logs = query.query({
      level: options.level,
      command: options.command,
      backupId: options.backupId,
      scheduleId: options.scheduleId,
      limit: options.limit,
      offset: options.offset,
    });

    if (logs.length === 0) {
      logger.info('No logs found');
      return;
    }

    logger.info(`Found ${logs.length} log entries:\n`);

    for (const log of logs) {
      const successIcon = log.success ? '✓' : '✗';
      console.log(
        `[${log.timestamp}] [${log.level.toUpperCase()}] ${successIcon} ${log.message}`
      );

      if (log.command) {
        console.log(`  Command: ${log.command}`);
      }
      if (log.backupId) {
        console.log(`  Backup ID: ${log.backupId}`);
      }
      if (log.error) {
        console.log(`  Error: ${log.error}`);
      }
      console.log();
    }
  } catch (error) {
    logger.error('Failed to list logs', error as Error);
    throw error;
  }
}

export async function logsStatsCommand(): Promise<void> {
  try {
    const store = createLogStore();
    const query = createLogQuery(store);

    const stats = query.getStats();
    const metadata = store.getMetadata();

    logger.info('Log Statistics:');
    console.log(`  Total Logs: ${stats.total}`);
    console.log(`  Debug: ${stats.byLevel.debug}`);
    console.log(`  Info: ${stats.byLevel.info}`);
    console.log(`  Warn: ${stats.byLevel.warn}`);
    console.log(`  Error: ${stats.byLevel.error}`);
    console.log(`  Success Rate: ${(stats.successRate * 100).toFixed(2)}%`);
    console.log(`  Last Log: ${metadata.lastLogTime || 'N/A'}`);
  } catch (error) {
    logger.error('Failed to get log stats', error as Error);
    throw error;
  }
}

export async function logsClearCommand(): Promise<void> {
  try {
    const store = createLogStore();
    store.clear();
    logger.success('Logs cleared successfully');
  } catch (error) {
    logger.error('Failed to clear logs', error as Error);
    throw error;
  }
}
