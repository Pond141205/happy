import { describe, expect, it } from 'vitest';
import { webcrypto, randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
import { decryptExperience, type EncryptedExperience } from './birthdayAccess';
function seal(code: string): EncryptedExperience {
  const salt = randomBytes(16), iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', pbkdf2Sync(code, salt, 310000, 32, 'sha256'), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify({ title: 'My last massage', message: 'A private test message.\n\nSecond paragraph.' })), cipher.final(), cipher.getAuthTag()]);
  return { version: 1, salt: salt.toString('base64'), iv: iv.toString('base64'), ciphertext: body.toString('base64') };
}
describe('Birthday-only encrypted entry', () => {
  it.each(['120399', '12031999'])('opens the message with an exact matching %s code', async code => {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
    const data = await decryptExperience(code, seal(code)); expect(data.message).toContain('\n\nSecond paragraph.');
  });
  it('rejects wrong birthdays and modified ciphertext', async () => {
    const data = seal('120399'); await expect(decryptExperience('130399', data)).rejects.toThrow();
    const body = Buffer.from(data.ciphertext, 'base64'); body[0] ^= 1;
    await expect(decryptExperience('120399', { ...data, ciphertext: body.toString('base64') })).rejects.toThrow();
  });
  it('rejects malformed and partial birthdays', async () => { await expect(decryptExperience('123', seal('120399'))).rejects.toThrow(); });
});
