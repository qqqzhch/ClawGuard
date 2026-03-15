import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

console.log('Building ClawGuard...');

// 1. Build core
console.log('Building @core/clawguard...');
execSync('pnpm --filter @core/clawguard build', { stdio: 'inherit' });

// 2. Build gateway
console.log('Building @clawguard/gateway...');
execSync('pnpm --filter @clawguard/gateway build', { stdio: 'inherit' });

// 3. Build web
console.log('Building @clawguard/web...');
execSync('pnpm --filter @clawguard/web build', { stdio: 'inherit' });

// 4. Build CLI
console.log('Building clawguard CLI...');
execSync('pnpm --filter clawguard build', { stdio: 'inherit' });

// 5. Copy web build to CLI public directory
console.log('Copying web build to CLI...');
const webDist = path.join('packages', 'web', 'dist');
const cliPublic = path.join('packages', 'cli', 'public');
fs.removeSync(cliPublic);
fs.copySync(webDist, cliPublic);

console.log('Build complete!');
