import crypto from 'crypto';
import type { EncryptResult } from './encrypt.js';

export async function decrypt(
  result: EncryptResult,
  key: Buffer,
): Promise<Buffer> {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, result.iv);
  decipher.setAuthTag(result.authTag);

  return Buffer.concat([
    decipher.update(result.data),
),
    decipher.final(),
  ]);
}
