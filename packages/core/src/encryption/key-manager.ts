import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EncryptionError } from '../errors/index.js';

const KEY_PATH = path.join(os.homedir(), '.clawguard', 'encryption.key');

export async function getKey(): Promise<Buffer | null> {
  try {
    const keyHex = await fs.readFile(KEY_PATH, 'utf-8');
    return Buffer.from(keyHex, 'hex');
  } catch {
    return null;
  }
}

export async function setKey(key: string): Promise<void> {
  if (key.length < 32) {
    throw new EncryptionError('Key must be at least 32 characters');
  }

  const keyBuffer = crypto.createHash('sha256').update(key).digest();

  const keyDir = path.dirname(KEY_PATH);
  await fs.mkdir(keyDir, { recursive: true });

  await fs.writeFile(KEY_PATH, keyBuffer.toString('hex'), 'utf-8');
}

export async function generateKey(): Promise<string> {
  return crypto.randomBytes(32).toString('hex');
}
