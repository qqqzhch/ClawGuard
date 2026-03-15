import {
  enableSchedule,
  disableSchedule,
  listSchedules,
  setRetainDays
} from '@core/clawguard';
import { createSpinner } from '../utils/spinner.js';
import { logger } from '../utils/logger.js';

export interface EnableScheduleOptions {
  name: string;
  level: 'config' | 'system' | 'full';
  cron: string;
  retainDays: number;
  backupDir?: string;
}

export async function enableScheduleCommand(options: EnableScheduleOptions): Promise<void> {
  const spinner = createSpinner(`Enabling schedule: ${options.name}`).start();
  try {
    const schedule = await enableSchedule({
      name: options.name,
      level: options.level,
      cron: options.cron,
      retainDays: options.retainDays,
      backupDir: options.backupDir || '.clawguard/backups'
    });
    spinner.succeed(`Schedule enabled successfully (ID: ${schedule.id})`);
  } catch (error) {
    spinner.fail(`Failed to enable schedule: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export interface DisableScheduleOptions {
  id: string;
  backupDir?: string;
}

export async function disableScheduleCommand(options: DisableScheduleOptions): Promise<void> {
  const spinner = createSpinner(`Disabling schedule: ${options.id}`).start();
  try {
    const schedule = await disableSchedule(options.id, {
      backupDir: options.backupDir || '.clawguard/backups'
    });
    spinner.succeed(`Schedule disabled successfully (ID: ${schedule.id})`);
  } catch (error) {
    spinner.fail(`Failed to disable schedule: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export interface ListSchedulesOptions {
  backupDir?: string;
}

export async function listSchedulesCommand(options: ListSchedulesOptions): Promise<void> {
  const spinner = createSpinner('Listing schedules').start();
  try {
    const schedules = await listSchedules({
      backupDir: options.backupDir || '.clawguard/backups'
    });
    spinner.succeed(`${schedules.length} schedule(s) found`);

    if (schedules.length === 0) {
      logger.info('No schedules found');
      return;
    }

    schedules.forEach((schedule, index) => {
      logger.log(`
${index + 1}. ID: ${schedule.id}
   Name: ${schedule.name}
   Level: ${schedule.level}
   Cron: ${schedule.cron}
   Retain Days: ${schedule.retainDays}
   Enabled: ${schedule.enabled}
   Last Run: ${schedule.lastRun ? new Date(schedule.lastRun).toLocaleString() : 'Never'}
   Next Run: ${new Date(schedule.nextRun).toLocaleString()}
        `.trim());
    });
  } catch (error) {
    spinner.fail(`Failed to list schedules: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export interface SetRetainDaysOptions {
  id: string;
  retainDays: number;
  backupDir?: string;
}

export async function setRetainDaysCommand(options: SetRetainDaysOptions): Promise<void> {
  const spinner = createSpinner(`Setting retain days for schedule: ${options.id}`).start();
  try {
    const schedule = await setRetainDays(options.id, options.retainDays, {
      backupDir: options.backupDir || '.clawguard/backups'
    });
    spinner.succeed(`Retain days updated to ${schedule.retainDays} for schedule: ${schedule.id}`);
  } catch (error) {
    spinner.fail(`Failed to set retain days: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}