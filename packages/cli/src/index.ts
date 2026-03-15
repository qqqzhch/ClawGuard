import cac from 'cac';
import { backupCommand } from './commands/backup.js';
import { handleVerifyCommand } from './commands/verify.js';
import { diffCommand } from './commands/diff.js';
import {
  enableScheduleCommand,
  disableScheduleCommand,
  listSchedulesCommand,
  setRetainDaysCommand
} from './commands/schedule.js';
import { listLogsCommand, logsStatsCommand, logsClearCommand } from './commands/logs.js';
import { handleGatewayCommand } from './commands/gateway.js';

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

cli
  .command('verify <backup-id>')
  .action(async (backupId) => {
    await handleVerifyCommand(backupId, {});
  });

cli
  .command('verify --all')
  .action(async () => {
    await handleVerifyCommand('--all', {});
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

// Logs commands
cli
  .command('logs', 'List operation logs')
  .option('--level <level>', 'Filter by log level (debug, info, warn, error)')
  .option('--command <cmd>', 'Filter by command name')
  .option('--backup-id <id>', 'Filter by backup ID')
  .option('--schedule-id <id>', 'Filter by schedule ID')
  .option('--limit <n>', 'Limit number of results', { default: '100' })
  .option('--offset <n>', 'Offset for pagination', { default: '0' })
  .action(async (options) => {
    await listLogsCommand({
      level: options.level,
      command: options.command,
      backupId: options.backupId,
      scheduleId: options.scheduleId,
      limit: parseInt(options.limit),
      offset: parseInt(options.offset),
    });
  });

cli
  .command('logs stats', 'Show log statistics')
  .action(async () => {
    await logsStatsCommand();
  });

cli
  .command('logs clear', 'Clear all logs')
  .action(async () => {
    await logsClearCommand();
  });

// Gateway commands
cli
  .command('gateway start', 'Start Web Gateway service')
  .option('--port <port>', 'Port to listen on', { default: '3000' })
  .action(async (options) => {
    await handleGatewayCommand('start', { port: parseInt(options.port) });
  });

cli
  .command('gateway status', 'Check Gateway service status')
  .action(async () => {
    await handleGatewayCommand('status', {});
  });

cli.parse();
