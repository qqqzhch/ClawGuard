import cac from 'cac';
import { backupCommand } from './commands/backup.js';
import { diffCommand } from './commands/diff.js';

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

cli.parse();
