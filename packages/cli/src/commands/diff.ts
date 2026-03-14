import { diff, type DiffOptions } from '@core/clawguard';
import { createSpinner } from '../utils/spinner.js';
import { logger } from '../utils/logger.js';

export interface DiffCommandOptions {
  backupDir?: string;
  ignore?: string;
}

export async function diffCommand(
  id1: string,
  id2: string,
  options: DiffCommandOptions,
): Promise<void> {
  const spinner = createSpinner('Comparing backups...').start();

  try {
    const diffOptions: DiffOptions = {
      backupDir: options.backupDir,
    };

    if (options.ignore) {
      diffOptions.ignoreFields = options.ignore.split(',').map(s => s.trim());
    }

    const result = await diff(id1, id2, diffOptions);

    spinner.succeed('Diff completed successfully!');

    // Output result in JSON format
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    spinner.fail('Diff failed!');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
