import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, getKey, setKey, generateKey } from '../index.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Encryption', () => {
  it('should encrypt and decrypt data', async () => {
    const data = Buffer.from('Hello, World!');
    // AES-256-GCM requires 32-byte key
    const key = Buffer.from('01234567890123456789012345678901');

    const result = await encrypt(data, key);
    const decrypted = await decrypt(result, key);

    expect(decrypted.toString()).toBe('Hello, World!');
  });

  it('should generate and store key', async () => {
    const key = await generateKey();
    await setKey(key);

    const storedKey = await getKey();
    expect(storedKey).not.toBeNull();
    expect(storedKey!.length).toBe(32); // AES-256-GCM requires 32-byte key

    // Cleanup
    const keyPath = path.join(os.homedir(), '.clawguard', 'encryption.key');
    await fs.unlink(keyPath).catch(() => {});
  });
});
