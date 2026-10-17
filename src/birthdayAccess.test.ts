import { describe, expect, it } from 'vitest';
import { webcrypto, randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
import { decryptExperience, normalizeBirthday, encryptedPhoto, clearPrivateMedia, type EncryptedExperience } from './birthdayAccess';
import { vi } from 'vitest';
function seal(code: string): EncryptedExperience {
  const salt = randomBytes(16), iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', pbkdf2Sync(code, salt, 310000, 32, 'sha256'), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify({ title: 'Just one thing', message: 'A private test message.\n\nSecond paragraph.' })), cipher.final(), cipher.getAuthTag()]);
  return { version: 1, salt: salt.toString('base64'), iv: iv.toString('base64'), ciphertext: body.toString('base64') };
}
describe('Birthday-only encrypted entry', () => {
  it('unlocks the same envelope using either short or full year input', async () => {
    const data = seal('120399');
    for (const input of ['120399', '12031999']) {
      expect((await decryptExperience(normalizeBirthday(input), data)).title).toBe('Just one thing');
    }
  });
  it('keeps a different birthday different and rejects malformed aliases', () => {
    expect(normalizeBirthday('12031999')).toBe('120399');
    expect(normalizeBirthday('13031999')).not.toBe('120399');
    for (const input of ['1203990', 'abc123', '12/03/1999']) expect(() => normalizeBirthday(input)).toThrow();
  });
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
  it('decrypts and caches images only after unlocking, and locks again on logout', async () => {
    clearPrivateMedia(); await expect(encryptedPhoto('encrypted-media/thumb/01.bin')).rejects.toThrow();
    const pack = seal('120399'); await decryptExperience('120399', pack);
    const key = pbkdf2Sync('120399', Buffer.from(pack.salt, 'base64'), 310000, 32, 'sha256'), iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
    const original = Buffer.from('test photo bytes'), sealed = Buffer.concat([iv, cipher.update(original), cipher.final(), cipher.getAuthTag()]);
    const request = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(sealed));
    try { expect(await (await encryptedPhoto('encrypted-media/thumb/01.bin')).text()).toBe(original.toString()); await encryptedPhoto('encrypted-media/thumb/01.bin'); expect(request).toHaveBeenCalledTimes(1); clearPrivateMedia(); await expect(encryptedPhoto('encrypted-media/thumb/01.bin')).rejects.toThrow(); await expect(encryptedPhoto('../photo.bin')).rejects.toThrow(); }
    finally { request.mockRestore(); clearPrivateMedia(); }
  });
});
