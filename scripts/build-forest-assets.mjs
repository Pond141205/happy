// Optional offline asset preparation; the site and CI never download external assets.
// Requires sharp (or --sharp /absolute/path/to/sharp's entry point).
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
const require = createRequire(import.meta.url), sharp = require(process.argv.includes('--sharp') ? process.argv[process.argv.indexOf('--sharp') + 1] : 'sharp');
const work = '.asset-work', out = 'public/textures/forest'; await mkdir(work, { recursive: true }); await mkdir(out, { recursive: true });
const sources = { 'leaf-color': 'leaves_diff', 'leaf-alpha': 'leaves_alpha', 'bark-color': 'diff', 'bark-normal': 'nor_gl' };
const provenance = [];
for (const [name, map] of Object.entries(sources)) {
  const path = `${work}/${name}.png`, url = `https://dl.polyhaven.org/file/ph-assets/Models/png/1k/tree_small_02/tree_small_02_${map}_1k.png`;
  try { await stat(path); } catch { const response = await fetch(url, { signal: AbortSignal.timeout(30000) }); if (!response.ok) throw Error(`Asset unavailable: ${name}`); await writeFile(path, new Uint8Array(await response.arrayBuffer())); }
  provenance.push({ url, sha256: createHash('sha256').update(await readFile(path)).digest('hex') });
}
// The source is a UV atlas with dilated padding, not a ready-to-use twig photograph.
// Isolate two real leaf surfaces and rebuild clean twigs, without padding artifacts.
const crops = [{ left: 62, top: 57, width: 155, height: 94 }, { left: 237, top: 65, width: 121, height: 69 }];
const isolated = await Promise.all(crops.map(async crop => {
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${crop.width}" height="${crop.height}" viewBox="0 0 1 1" preserveAspectRatio="none"><path d="M .055 .36 C .3 .015 .69 .065 .955 .68 C .71 .985 .29 .97 .055 .36" fill="white"/></svg>`);
  const { data, info } = await sharp(`${work}/leaf-color.png`).extract(crop).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) if (data[i] > 175 && data[i + 1] > 175 && data[i + 2] > 150) data[i + 3] = 0;
  return sharp(data, { raw: info }).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}));
const twigs = await Promise.all([0, 1].map(async variant => {
  const defs = isolated.map((b, i) => `<image id="leaf${i}" width="190" height="115" href="data:image/png;base64,${b.toString('base64')}"/>`).join('');
  let leaves = '';
  for (let i = 0; i < 8; i++) for (const side of [-1, 1]) {
    const y = 100 + i * 110 + (side === 1 ? 48 : 0), x = 255 + Math.sin(i * .8 + variant) * 17;
    const size = .7 + .28 * Math.sin((i + 1) / 9 * Math.PI), angle = side * (8 + (i % 3) * 8) + variant * 8;
    leaves += `<path d="M ${x} ${y + 65} L ${x + side * 25} ${y + 35}" stroke="#66713b" stroke-width="2.5"/><g transform="translate(${x + side * 20} ${y + 35}) rotate(${angle}) scale(${-side * size} ${size})"><use href="#leaf${(i + variant) % 2}" x="-181" y="-78"/></g>`;
  }
  return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="1024"><defs>${defs}</defs><path d="M 255 1020 Q 270 740 245 500 Q 230 250 255 30" fill="none" stroke="#596537" stroke-width="5"/>${leaves}</svg>`)).png().toBuffer();
}));
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#00000000' } }).composite(twigs.map((input, i) => ({ input, left: i * 512, top: 0 }))).webp({ quality: 88, alphaQuality: 100 }).toFile(`${out}/twigs.webp`);
// Sample only bark UV islands; avoid the source atlas' stretched padding.
const barkCrop = { left: 55, top: 332, width: 125, height: 650 };
await sharp(`${work}/bark-color.png`).extract(barkCrop).resize(256, 1024).webp({ quality: 85 }).toFile(`${out}/bark.webp`);
await sharp(`${work}/bark-normal.png`).extract(barkCrop).resize(128, 512).webp({ quality: 92 }).toFile(`${out}/bark-normal.webp`);

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { treeStructure, twigCards } = await vite.ssrLoadModule('/src/rooms/treeModel.ts');
  const cards = twigCards(0), branches = treeStructure().branches, scale = 512 / 16;
  const frames = [];
  for (let frame = 0; frame < 4; frame++) {
    const angle = frame * Math.PI / 2, c = Math.cos(angle), s = Math.sin(angle);
    const project = p => ({ x: p.x * c - p.z * s, y: p.y, depth: p.x * s + p.z * c });
    const defs = twigs.map((b, i) => `<image id="twig${i}" width="512" height="1024" href="data:image/png;base64,${b.toString('base64')}"/>`).join('');
    const wood = branches.map(b => { const a = project(b.from), d = project(b.to); return `<line x1="${256 + a.x * scale}" y1="${490 - a.y * scale}" x2="${256 + d.x * scale}" y2="${490 - d.y * scale}" stroke="#65574a" stroke-width="${Math.max(.5, b.radius * 2 * scale)}" stroke-linecap="round"/>`; }).join('');
    const leaves = [...cards].sort((a, b) => project(a.center).depth - project(b.center).depth).map(card => {
      // Euler XYZ basis, matching the runtime card geometry.
      const cx = Math.cos(card.rotation.x), sx = Math.sin(card.rotation.x), cy = Math.cos(card.rotation.y), sy = Math.sin(card.rotation.y), cz = Math.cos(card.rotation.z), sz = Math.sin(card.rotation.z);
      const right = project({ x: cy * cz, y: cx * sz + sx * sy * cz, z: sx * sz - cx * sy * cz });
      const up = project({ x: -cy * sz, y: cx * cz - sx * sy * sz, z: sx * cz + cx * sy * sz });
      const center = project(card.center), a = right.x * card.width * scale / 512, b = -right.y * card.width * scale / 512, cc = -up.x * card.height * scale / 1024, d = up.y * card.height * scale / 1024;
      const tx = 256 + center.x * scale - a * 256 - cc * 512, ty = 490 - center.y * scale - b * 256 - d * 512;
      return `<use href="#twig${card.tile}" transform="matrix(${a} ${b} ${cc} ${d} ${tx} ${ty})"/>`;
    }).join('');
    frames.push(await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs>${defs}</defs>${wood}${leaves}</svg>`)).png().toBuffer());
  }
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#00000000' } }).composite(frames.map((input, i) => ({ input, left: i % 2 * 512, top: Math.floor(i / 2) * 512 }))).webp({ quality: 88, alphaQuality: 100 }).toFile(`${out}/tree-views.webp`);
} finally { await vite.close(); }
await writeFile(`${out}/sources.json`, JSON.stringify({ asset: 'Tree Small 02', author: 'Rico Cilliers', license: 'CC0-1.0', source: 'https://polyhaven.com/a/tree_small_02', licenseUrl: 'https://polyhaven.com/license', derivatives: 'Cropped and packed twig alpha/color atlas, cropped bark color/normal, four orthographic tree impostors from the runtime model.', sources: provenance }, null, 2) + '\n');
const manifest = [];
for (const name of ['twigs.webp', 'bark.webp', 'bark-normal.webp', 'tree-views.webp']) {
  const path = `${out}/${name}`, metadata = await sharp(path).metadata(), data = await readFile(path);
  manifest.push({ name, width: metadata.width, height: metadata.height, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
  console.log(name, data.length, 'bytes');
}
await writeFile(`${out}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
