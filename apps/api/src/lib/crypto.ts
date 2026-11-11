import crypto from 'crypto';
import { env } from '../config/env';

const ALGO = 'aes-256-gcm';

function key(): Buffer {
  const k = env.AI_ENCRYPTION_KEY || process.env.AI_ENCRYPTION_KEY;
  if (!k) throw new Error('AI_ENCRYPTION_KEY not configured');
  return crypto.createHash('sha256').update(k).digest();
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(cipherText: string): string {
  const buf = Buffer.from(cipherText, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, key(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}
