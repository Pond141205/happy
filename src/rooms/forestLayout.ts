export type TreeSite = { x: number; y: number; z: number; height: number; spread: number; phase: number };
export function seededRandom(seed: number) {
  let n = seed >>> 0;
  return () => { n += 0x6D2B79F5; let t = Math.imul(n ^ n >>> 15, 1 | n); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function groundHeight(x: number, z: number) {
  const r = Math.hypot(x, z), slope = Math.max(0, r - 13);
  return -.22 - Math.min(16, slope * .145) + Math.min(1, slope / 18) * (Math.sin(x * .084 + z * .046) * 1.3 + Math.cos(z * .12) * .65);
}
export function clearOfMuseum(x: number, z: number, margin = 0) {
  // Room 2 is at this environment's origin; Room 1 and the passage are toward +Z.
  return !(Math.abs(x) < 6 + margin && z > -9 - margin && z < 29 + margin);
}
export function forestSites(seed = 2818, count = 100): TreeSite[] {
  const random = seededRandom(seed), sites: TreeSite[] = [];
  for (let attempt = 0; sites.length < count && attempt < count * 50; attempt++) {
    const a = random() * Math.PI * 2, r = 9 + Math.pow(random(), 1.5) * 80, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const height = 9 + random() * 7, spread = 2 + random() * 1.5, phase = random() * Math.PI * 2;
    // Keep the full leaf crown outside the building, not only its trunk.
    if (!clearOfMuseum(x, z, spread * 2.25)) continue;
    // Preserve a view from the central back window into the distant mountain valley.
    if (z < -10 && Math.abs(x) < 7 + (-z - 10) * .07) continue;
    sites.push({ x, y: groundHeight(x, z), z, height, spread, phase });
  }
  return sites;
}
