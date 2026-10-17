export type PrivateExperience = { title: string; message: string };
export type EncryptedExperience = { version: 1; salt: string; iv: string; ciphertext: string };
const bytes = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
export async function decryptExperience(code: string, envelope: EncryptedExperience): Promise<PrivateExperience> {
  if (!/^(?:\d{6}|\d{8})$/.test(code) || envelope.version !== 1) throw new Error('Invalid birthday envelope');
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bytes(envelope.salt), iterations: 310000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(envelope.iv) }, key, bytes(envelope.ciphertext));
  const data = JSON.parse(new TextDecoder().decode(plain));
  if (typeof data.message !== 'string' || data.message.length > 30000 || typeof data.title !== 'string') throw new Error('Invalid message');
  return { title: data.title, message: data.message };
}
export async function unlockExperience(code: string) {
  const url = import.meta.env.DEV ? '/__local-experience' : `${import.meta.env.BASE_URL}experience.enc.json`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('ยังไม่ได้เตรียมรหัสสำหรับเว็บนี้ กรุณาติดต่อเจ้าของ');
  try { return await decryptExperience(code, await response.json()); }
  catch { throw new Error('ลองอีกครั้งนะ วันที่พิเศษของเทอ ✧'); }
}
