import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

console.log('Building ClawGuard...');

// 1. Build core
console.log('Building @core/clawguard...');
execSync('pnpm --filter @core/clawguard build', { stdio: 'inherit' });

// 2. Build CLI
console.log('Building @cli/clawguard...');
execSync('pnpm --filter @cli/clawguard build', { stdio: 'inherit' });

// 3. Build Web UI client
console.log('Building Web UI client...');
execSync('pnpm --filter @web/clawguard build:client', { stdio: 'inherit' });

// 4. Copy Web UI static assets to CLI
console.log('Copying Web UI assets to CLI...');
const webDist = path.resolve('packages/web/client/dist');
const cliPublic = path.resolve('packages/cli/public');
fs.copySync(webDist, cliPublic, { overwrite: true });

// 5. Copy Web API server to CLI
console.log('Copying Web API server to CLI...');
const webServerSrc = path.resolve('packages/web/server/src');
const cliServerSrc = path.resolve('packages/cli/src/server');
fs.copySync(webServerSrc, cliServerSrc, { overwrite: true });

console.log('Build complete!');
