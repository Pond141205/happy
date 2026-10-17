export type PrivateExperience = { title: string; message: string; photos?: { path: string; thumbnailPath: string }[] };
export type EncryptedExperience = { version: 1; salt: string; iv: string; ciphertext: string };
const bytes = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
let mediaKey: CryptoKey | undefined;
const mediaCache = new Map<string, Promise<Blob>>();
export function clearPrivateMedia() { mediaKey = undefined; mediaCache.clear(); }
export async function encryptedPhoto(path: string): Promise<Blob> {
  if (!/^encrypted-media\/(?:thumb|full)\/\d{2}\.bin$/.test(path) || !mediaKey) throw new Error('Photo access locked');
  if (!mediaCache.has(path)) {
    const key = mediaKey;
    const request = (async () => { const response = await fetch(`${import.meta.env.BASE_URL}${path}`); if (!response.ok) throw new Error('Photo unavailable'); const data = new Uint8Array(await response.arrayBuffer()); const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: data.slice(0, 12) }, key, data.slice(12)); return new Blob([plain], { type: 'image/webp' }); })();
    mediaCache.set(path, request); request.catch(() => mediaCache.delete(path));
  }
  return mediaCache.get(path)!;
}
export function normalizeBirthday(code: string) {
  if (!/^(?:\d{6}|\d{8})$/.test(code)) throw new Error('Invalid birthday format');
  return code.length === 8 ? code.slice(0, 4) + code.slice(-2) : code;
}
export async function decryptExperience(code: string, envelope: EncryptedExperience): Promise<PrivateExperience> {
  if (!/^(?:\d{6}|\d{8})$/.test(code) || envelope.version !== 1) throw new Error('Invalid birthday envelope');
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bytes(envelope.salt), iterations: 310000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(envelope.iv) }, key, bytes(envelope.ciphertext));
  const data = JSON.parse(new TextDecoder().decode(plain));
  if (typeof data.message !== 'string' || data.message.length > 30000 || typeof data.title !== 'string') throw new Error('Invalid message');
  if (data.photos && (!Array.isArray(data.photos) || data.photos.length !== 32 || data.photos.some((p: { path: string; thumbnailPath: string }) => !/^encrypted-media\/full\/\d{2}\.bin$/.test(p.path) || !/^encrypted-media\/thumb\/\d{2}\.bin$/.test(p.thumbnailPath)))) throw new Error('Invalid photo manifest');
  mediaKey = key; mediaCache.clear();
  return { title: data.title, message: data.message, ...(data.photos ? { photos: data.photos } : {}) };
}
export async function unlockExperience(code: string) {
  const url = import.meta.env.DEV ? '/__local-experience' : `${import.meta.env.BASE_URL}experience.enc.json`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('ยังไม่ได้เตรียมรหัสสำหรับเว็บนี้ กรุณาติดต่อเจ้าของ');
  try { return await decryptExperience(normalizeBirthday(code), await response.json()); }
  catch { throw new Error('ลองอีกครั้งนะ วันที่พิเศษของเทอ ✧'); }
}
