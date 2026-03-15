import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

console.log('Building ClawGuard...');

// 1. Build core
console.log('Building @core/clawguard...');
execSync('pnpm --filter @core/clawguard build', { stdio: 'inherit' });

// 2. Build CLI
console.log('Building clawguard CLI...');
execSync('pnpm --filter clawguard build', { stdio: 'inherit' });

console.log('Build complete!');
