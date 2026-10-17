import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import assert from 'node:assert/strict';

const base = process.argv[2] || '/happy/';
assert(/^\/(?:[\w.-]+\/)*$/.test(base) && !base.split('/').includes('..'), 'Invalid smoke-test base path');
const root = resolve('dist');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!pathname.startsWith(base)) { response.writeHead(404).end(); return; }
    const file = resolve(root, pathname.slice(base.length) || 'index.html');
    if (!file.startsWith(root + sep)) { response.writeHead(404).end(); return; }
    const data = await readFile(file); response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }).end(data);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
try {
  const response = await fetch(origin + base); assert.equal(response.status, 200);
  const html = await response.text(), urls = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) if (m[1].startsWith(base)) urls.add(m[1]);
  const assetFiles = await import('node:fs/promises').then(fs => fs.readdir(resolve(root, 'assets')));
  for (const name of assetFiles.filter(f => /\.(?:js|css|woff2?)$/.test(f))) urls.add(`${base}assets/${name}`);
  for (const name of ['images/memory-coast.png', 'images/memory-meadow.png', 'audio/you-and-i.mp3', 'audio/about-you.mp3', '.nojekyll']) urls.add(base + name);
  for (const url of urls) {
    const asset = await fetch(origin + url); assert.equal(asset.status, 200, `Asset unavailable: ${url}`);
    const data = new Uint8Array(await asset.arrayBuffer());
    const fileSize = (await stat(resolve(root, url.slice(base.length)))).size;
    assert.equal(data.length, fileSize, `Truncated asset: ${url}`);
    if (url.endsWith('.js')) assert.match(asset.headers.get('content-type'), /javascript/);
    if (url.endsWith('.mp3')) assert.equal(asset.headers.get('content-type'), 'audio/mpeg');
  }
  if (base !== '/') assert.equal((await fetch(origin + '/assets/missing.js')).status, 404);
  console.log(`Pages HTTP smoke check passed: ${urls.size} assets, module MIME, both MP3s and favicon under ${base}`);
} finally { await new Promise(resolve => server.close(resolve)); }
