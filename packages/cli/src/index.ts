import cac from 'cac';
import { backupCommand } from './commands/backup.js';

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

cli.parse();
