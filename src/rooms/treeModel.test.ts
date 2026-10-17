import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { forestSites, type TreeSite } from './forestLayout';
import { forestCell, impostorTile, TREE_BUDGET, treeDetails, treeGeometry, treeStructure, twigCards } from './treeModel';

const triangles = (g: ReturnType<typeof treeGeometry>) => [g.wood, g.leaves].reduce((n, mesh) => n + (mesh.index?.count ?? mesh.getAttribute('position').count) / 3, 0);
describe('Photographic forest and LOD budgets', () => {
  it('builds deterministic branching with finite, tapered limbs', () => {
    const a = treeStructure(), b = treeStructure(); expect(a).toEqual(b); expect(a.branches.length).toBeGreaterThan(80);
    for (const limb of a.branches) { expect(limb.radius).toBeGreaterThan(0); expect(limb.tip).toBeLessThanOrEqual(limb.radius); expect(limb.from.distanceTo(limb.to)).toBeGreaterThan(0); }
    expect(twigCards(0)).toEqual(twigCards(0));
  });
  it('keeps card normals, atlas UVs and model extents valid at both detail levels', () => {
    for (const detail of [0, 1] as const) {
      const geometry = treeGeometry(detail), leaf = geometry.leaves, uv = leaf.getAttribute('uv'), normal = leaf.getAttribute('normal');
      for (const mesh of [geometry.wood, leaf]) { expect([...mesh.getAttribute('position').array].every(Number.isFinite)).toBe(true); mesh.computeBoundingBox(); expect(Math.max(Math.abs(mesh.boundingBox!.min.x), Math.abs(mesh.boundingBox!.max.x), Math.abs(mesh.boundingBox!.min.z), Math.abs(mesh.boundingBox!.max.z))).toBeLessThan(6.75); }
      for (let i = 0; i < uv.count; i++) { expect(uv.getX(i)).toBeGreaterThanOrEqual(0); expect(uv.getX(i)).toBeLessThanOrEqual(1); expect(uv.getY(i)).toBeGreaterThanOrEqual(0); expect(uv.getY(i)).toBeLessThanOrEqual(1); expect(Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i))).toBeCloseTo(1, 5); }
      geometry.wood.dispose(); leaf.dispose();
    }
  });
  it('uses materially fewer triangles at middle distance and stays below the old forest cost', () => {
    const near = treeGeometry(0), mid = treeGeometry(1), nearTriangles = triangles(near), midTriangles = triangles(mid);
    expect(midTriangles).toBeLessThan(nearTriangles * .65);
    const sites = forestSites();
    for (const compact of [false, true]) for (const z of [-6.5, 0, 16, 26.4]) {
      const levels = treeDetails(sites, 4, z, compact);
      const total = levels.reduce<number>((sum, level) => sum + (level === 0 ? nearTriangles : level === 1 ? midTriangles : 2), 0);
      expect(total).toBeLessThan(150000);
      const batches = new Set(sites.map((s, i) => `${forestCell(s.x, s.z)}:${levels[i]}`));
      const calls = [...batches].reduce((sum, name) => sum + (name.endsWith(':2') ? 1 : 2), 0); expect(calls).toBeLessThanOrEqual(35);
    }
    near.wood.dispose(); near.leaves.dispose(); mid.wood.dispose(); mid.leaves.dispose();
  });
  it('caps detailed trees, prioritizes nearest sites and applies smaller mobile budgets', () => {
    const sites = Array.from({ length: 100 }, (_, i) => ({ x: i * .1, z: 0, y: 0, height: 12, spread: 3, phase: 0 }));
    for (const compact of [false, true]) {
      const levels = treeDetails(sites, 0, 0, compact); expect(levels.filter(l => l === 0)).toHaveLength(compact ? 6 : TREE_BUDGET.nearLimit); expect(levels.filter(l => l === 1)).toHaveLength(compact ? 28 : TREE_BUDGET.middleLimit); expect(levels[0]).toBe(0); expect(levels[99]).toBe(2);
    }
    expect(treeDetails(sites, NaN, 0, false).every(level => level === 2)).toBe(true);
    expect(treeDetails(sites, 1000, 1000, false).every(level => level === 2)).toBe(true);
  });
  it('uses hysteresis around the LOD boundaries without exceeding budgets', () => {
    const site: TreeSite = { x: 33, z: 0, y: 0, height: 12, spread: 3, phase: 0 };
    expect(treeDetails([site], 0, 0, false)).toEqual([1]); expect(treeDetails([site], 0, 0, false, [0])).toEqual([0]);
    expect(treeDetails([{ ...site, x: 36 }], 0, 0, false, [0])).toEqual([1]);
    expect(treeDetails([{ ...site, x: 64 }], 0, 0, false, [1])).toEqual([1]);
  });
  it('selects all four baked views relative to tree rotation, with wraparound', () => {
    const tree = { x: 0, z: 0, y: 0, height: 12, spread: 3, phase: 0 };
    expect([[0, 10], [10, 0], [0, -10], [-10, 0]].map(([x, z]) => impostorTile(tree, x, z))).toEqual([0, 1, 2, 3]);
    expect(impostorTile({ ...tree, phase: Math.PI / 2 }, 10, 0)).toBe(0);
    expect(impostorTile({ ...tree, phase: 20 * Math.PI }, 0, 10)).toBe(0);
  });
  it('ships only compact, reproducible local textures within a 16 MiB GPU budget', () => {
    const root = 'public/textures/forest/', manifest = JSON.parse(readFileSync(root + 'manifest.json', 'utf8')) as { name: string; width: number; height: number; bytes: number; sha256: string }[];
    expect(manifest).toHaveLength(4); let bytes = 0, gpuBytes = 0;
    for (const asset of manifest) {
      const data = readFileSync(root + asset.name); expect(data.toString('ascii', 0, 4)).toBe('RIFF'); expect(data.toString('ascii', 8, 12)).toBe('WEBP'); expect(statSync(root + asset.name).size).toBe(asset.bytes); expect(createHash('sha256').update(data).digest('hex')).toBe(asset.sha256); expect(Math.max(asset.width, asset.height)).toBeLessThanOrEqual(1024); bytes += asset.bytes; gpuBytes += asset.width * asset.height * 4 * 4 / 3;
    }
    expect(bytes).toBeLessThan(750000); expect(gpuBytes).toBeLessThan(16 * 1024 * 1024);
    expect(JSON.parse(readFileSync(root + 'sources.json', 'utf8')).license).toBe('CC0-1.0');
  });
});
