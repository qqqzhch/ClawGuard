import { backup } from '@core/clawguard';
import type { BackupOptions } from '@core/clawguard';
import { createSpinner } from '../utils/spinner.js';
import { logger } from '../utils/logger.js';

export async function backupCommand(
  options: BackupOptions,
): Promise<void> {
  const spinner = createSpinner('Creating backup...').start();

  try {
    const result = await backup(options);

    spinner.succeed('Backup created successfully!');
    logger.info('ID: ' + result.metadata.id);
    logger.info('Level: ' + result.metadata.level);
    logger.info('Size: ' + (result.metadata.size / 1024).toFixed(2) + ' KB');
    logger.info('Files: ' + result.metadata.fileCount);
  } catch (error) {
    spinner.fail('Backup failed!');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
