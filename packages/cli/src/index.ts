import cac from 'cac';
import { backupCommand } from './commands/backup.js';
import { diffCommand } from './commands/diff.js';
import {
  enableScheduleCommand,
  disableScheduleCommand,
  listSchedulesCommand,
  setRetainDaysCommand
} from './commands/schedule.js';

const cli = cac('clawguard');

cli.version('1.0.0').help();

cli
  .command('backup')
  .option('--level <level>', 'Backup level: config, system, or full', {
    default: 'config',
  })
  .option('--name <name>', 'Backup name')
  .option('--output <path>', 'Output directory')
  .option('--encrypt', 'Encrypt backup')
  .action(async (options) => {
    await backupCommand({
      level: options.level,
      name: options.name,
      output: options.output,
      encrypt: options.encrypt,
    });
  });

cli
  .command('diff <id1> <id2>')
  .option('--backup-dir <path>', 'Custom backup directory')
  .option('--ignore <fields>', 'Comma-separated fields to ignore')
  .action(async (id1, id2, options) => {
    await diffCommand(id1, id2, {
      backupDir: options.backupDir,
      ignore: options.ignore,
    });
  });

// Schedule commands
cli
  .command('schedule enable <name> <level> <cron> <retain-days>', 'Enable a backup schedule')
  .option('--backup-dir <dir>', 'Backup directory', { default: '.clawguard/backups' })
  .action(async (name, level, cron, retainDays, options) => {
    await enableScheduleCommand({
      name,
      level,
      cron,
      retainDays: parseInt(retainDays),
      backupDir: options.backupDir
    });
  });

cli
  .command('schedule disable <id>', 'Disable a backup schedule')
  .option('--backup-dir <dir>', 'Backup directory', { default: '.clawguard/backups' })
  .action(async (id, options) => {
    await disableScheduleCommand({
      id,
      backupDir: options.backupDir
    });
  });

cli
  .command('schedule list', 'List all backup schedules')
  .option('--backup-dir <dir>', 'Backup directory', { default: '.clawguard/backups' })
  .action(async (options) => {
    await listSchedulesCommand({
      backupDir: options.backupDir
    });
  });

cli
  .command('schedule set-retain-days <id> <days>', 'Set retain days for a schedule')
  .option('--backup-dir <dir>', 'Backup directory', { default: '.clawguard/backups' })
  .action(async (id, days, options) => {
    await setRetainDaysCommand({
      id,
      retainDays: parseInt(days),
      backupDir: options.backupDir
    });
  });

cli.parse();
