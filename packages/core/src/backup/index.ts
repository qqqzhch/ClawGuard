import { backupLevel1 } from './level-1.js';
import { backupLevel2 } from './level-2.js';
import { backupLevel3 } from './level-3.js';

export async function backup(options: any): Promise<any> {
  switch (options.level) {
    case 'config':
      return backupLevel1(options);
    case 'system':
      return backupLevel2(options);
    case 'full':
      return backupLevel3(options);
    default:
      throw new Error(`Invalid backup level: ${options.level}`);
  }
}

export * from './metadata.js';
export * from './level-1.js';
export * from './level-2.js';
export * from './level-3.js';
