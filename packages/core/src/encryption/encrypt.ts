import crypto from 'crypto';

export interface EncryptResult {
  data: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

export async function encrypt(
  data: Buffer,
  key: Buffer,
): Promise<EncryptResult> {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final(),
  ]);

  return {
    data: encrypted,
    iv,
    authTag: cipher.getAuthTag(),
  };
}
