import assert from 'node:assert/strict';
// Check actual response bytes, not just status: SPA fallbacks also return HTTP 200.
const base = process.argv[2] || 'http://127.0.0.1:5173/';
for (const filename of ['you-and-i.mp3', 'about-you.mp3']) {
  const response = await fetch(new URL(`audio/${filename}`, base), { signal: AbortSignal.timeout(10000) });
  assert(response.ok, `${filename}: HTTP ${response.status}`);
  assert(response.headers.get('content-type')?.includes('audio/mpeg'), `${filename}: expected audio/mpeg, not an HTML fallback`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert(bytes.length > 1000, `${filename}: empty or truncated audio`);
  assert(new TextDecoder().decode(bytes.slice(0, 3)) === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224), `${filename}: missing MP3 header`);
  console.log(`${filename}: MP3 response verified (${bytes.length} bytes)`);
}
