import { verify, verifyAll } from '@core/clawguard';
import type { VerifyResult } from '@core/clawguard';

export interface VerifyCommandOptions {
  backupDir?: string;
  all?: boolean;
  repair?: boolean;
}

export async function handleVerifyCommand(
  id: string | undefined,
  options: VerifyCommandOptions,
): Promise<void> {
  const backupDir = options.backupDir || '.clawguard/backups';

  if (id) {
    // Verify single backup
    const result = await verify(id, { backupDir });

    console.log(`Backup ID: ${result.backupId}`);
    console.log(`Status: ${result.valid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`Message: ${result.message}`);

    if (result.checksum) {
      console.log(`Stored Checksum: ${result.checksum}`);
    }
  } else if (options.all) {
    // Verify all backups
    const result = await verifyAll({ backupDir });

    console.log(`Total backups: ${result.total}`);
    console.log(`Valid: ${result.valid}`);
    console.log(`Invalid: ${result.invalid}`);

    if (result.invalid > 0) {
      console.log('\nInvalid backups:');
      result.details
        .filter(d => !d.valid)
        .forEach(d => {
          console.log(`  - ${d.backupId}: ${d.message}`);
        });
    }
  } else {
    console.error('Please specify a backup ID or use --all flag');
    process.exit(1);
  }
}
