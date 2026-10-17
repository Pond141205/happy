import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const index = await readFile('dist/index.html', 'utf8');
const base = process.argv[2] || '/';
assert(base.startsWith('/') && base.endsWith('/'), 'Pass a Pages base path with leading and trailing slashes');
const moduleSource = index.match(/<script[^>]+src="([^"]+)"/)?.[1];
assert(moduleSource?.startsWith(`${base}assets/`), `Module must load below ${base}`);
assert(index.includes(`href="${base}favicon.svg"`), 'Favicon must respect the Pages subpath');
assert(index.includes('Content-Security-Policy'), 'Production must retain CSP');
assert(!index.includes('unsafe-eval'), 'Do not permit eval');
const files = await readdir('dist/assets');
const scripts = await Promise.all(files.filter(f => f.endsWith('.js')).map(f => readFile(`dist/assets/${f}`, 'utf8')));
assert(!scripts.join('').includes('ชมเวอร์ชันตัวอย่าง'), 'Development entry must not ship');
assert(!scripts.join('').includes('Dome corners'), 'Development geometry harness must not ship');
assert(!(await readdir('dist')).includes('scripts'), 'Do not publish development scripts as site pages');
assert(!(await readdir('dist')).includes('private-media'), 'Personal photos must never be copied into the public build');
assert(!scripts.join('').includes('__local-media'), 'Local photo access must be removed from production');
assert(!scripts.join('').includes('__local-experience'), 'Local private experience access must not ship');
assert(!scripts.join('').includes('เข้าสู่ระบบด้วย Google'), 'Google login UI must be removed');
const envelope = JSON.parse(await readFile('dist/experience.enc.json', 'utf8'));
assert(envelope.version === 1 && typeof envelope.ciphertext === 'string' && !('message' in envelope) && !('birthday' in envelope), 'Publish encrypted message only');
for (const kind of ['thumb', 'full']) {
  const photos = await readdir(`dist/encrypted-media/${kind}`); assert(photos.length === 32 && photos.every(f => /^\d{2}\.bin$/.test(f)), 'Publish 32 encrypted images per size, never plain photos');
}
assert(!files.some(f => f.endsWith('.map')), 'No production source maps');
assert(!/VITE_.*SERVICE_ROLE/.test(scripts.join('')), 'Never bundle service credentials');
console.log(`Production checks passed below ${base}: CSP retained, demo entry removed, no source maps.`);
