import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { mountainBackdropGeometry, panoramaV, FOREST_LAYERS, forestLayerHeight } from './mountainBackdrop';
import { badtzGeometry } from './badtzModel';

describe('Photographic distant scenery', () => {
  it('preserves the source aspect in angular space and overlaps three parallax depths', () => {
    // 90° per photo horizontally, 45° vertically for a 2:1 source.
    expect(panoramaV(.1) - panoramaV(0)).toBeCloseTo(.1 / (Math.PI / 4));
    expect(FOREST_LAYERS.map(l => l.radius)).toEqual([76, 125, 195]);
    const atlas = readFileSync('public/images/environment/forest-ridges.webp');
    expect(atlas.toString('ascii', 8, 12)).toBe('WEBP'); expect(atlas.length).toBeLessThan(500000);
    for (const layer of FOREST_LAYERS) {
      const height = forestLayerHeight(layer.radius);
      expect((2 * Math.PI * layer.radius / 3) / height).toBeCloseTo(6);
      expect(layer.bottom + height).toBeGreaterThan(4);
      expect(layer.bottom).toBeLessThan(-10);
    }
  });
  it('uses a low-cost enclosing sphere and finite UVs inside the local panorama', () => {
    const g = mountainBackdropGeometry(), uv = g.getAttribute('uv'); g.computeBoundingSphere();
    expect(g.boundingSphere!.radius).toBeCloseTo(410, 3); expect(g.index!.count / 3).toBeLessThan(5000);
    for (let i = 0; i < uv.count; i++) { expect(Number.isFinite(uv.getX(i))).toBe(true); expect(uv.getY(i)).toBeGreaterThanOrEqual(0); expect(uv.getY(i)).toBeLessThanOrEqual(1); }
    const photo = readFileSync('public/images/environment/mountain-panorama.webp'); expect(photo.toString('ascii', 0, 4)).toBe('RIFF'); expect(photo.toString('ascii', 8, 12)).toBe('WEBP'); expect(photo.length).toBeLessThan(200000); g.dispose();
  });
});
describe('Badtz-Maru fondant model', () => {
  it('has a broad spiked head, stable feet and a bounded four-material mesh budget', () => {
    const model = badtzGeometry(); let triangles = 0;
    expect(Object.keys(model)).toHaveLength(4);
    for (const g of Object.values(model)) { expect([...g.getAttribute('position').array].every(Number.isFinite)).toBe(true); g.computeBoundingBox(); triangles += (g.index?.count ?? g.getAttribute('position').count) / 3; }
    expect(model.black.boundingBox!.max.y).toBeGreaterThan(1.3); expect(model.black.boundingBox!.max.x - model.black.boundingBox!.min.x).toBeGreaterThan(.95);
    expect(2.17 + model.gold.boundingBox!.min.y * .55).toBeGreaterThan(2.14); expect(triangles).toBeLessThan(20000);
    Object.values(model).forEach(g => g.dispose());
  });
  it('keeps eyes and pupils in front of the head rather than hidden inside it', () => {
    const model = badtzGeometry(), material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const black = new THREE.Mesh(model.black, material), ivory = new THREE.Mesh(model.ivory, material), ink = new THREE.Mesh(model.ink, material); [black, ivory, ink].forEach(m => m.updateMatrixWorld());
    for (const side of [-1, 1]) {
      const ray = new THREE.Raycaster(new THREE.Vector3(side * .158, .841, 1), new THREE.Vector3(0, 0, -1));
      const first = ray.intersectObjects([black, ivory, ink])[0]; expect(first.object).toBe(ink);
    }
    Object.values(model).forEach(g => g.dispose()); material.dispose();
  });
});
