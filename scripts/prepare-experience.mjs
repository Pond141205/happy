// Private input stays in ignored storage. Only encrypted output may be published.
import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
const config = JSON.parse(await readFile('private-media/experience.json', 'utf8'));
if (!/^(?:\d{6}|\d{8})$/.test(config.birthday) || typeof config.message !== 'string') throw new Error('Set birthday and message in private-media/experience.json');
const birthday = config.birthday.length === 8 ? config.birthday.slice(0, 4) + config.birthday.slice(-2) : config.birthday;
const salt = randomBytes(16), iv = randomBytes(12), key = pbkdf2Sync(birthday, salt, 310000, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(JSON.stringify({ title: 'Just one thing', message: config.message }), 'utf8'), cipher.final(), cipher.getAuthTag()]);
const output = process.argv.includes('--publish') ? 'public/experience.enc.json' : 'private-media/experience.enc.json';
await writeFile(output, JSON.stringify({ version: 1, salt: salt.toString('base64'), iv: iv.toString('base64'), ciphertext: encrypted.toString('base64') }));
console.log(`Encrypted message saved: ${output}. Birthday codes have low entropy; encryption does not prevent guessing.`);
