import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { clearOfMuseum, forestSites, groundHeight, seededRandom } from './forestLayout';
describe('Spatial forest environment', () => {
  it('rebuilds the same forest after album/3D remounts and places roots on the terrain', () => {
    const trees = forestSites(); expect(trees).toEqual(forestSites()); expect(trees).toHaveLength(100);
    for (const t of trees) { expect(clearOfMuseum(t.x, t.z, 1.2)).toBe(true); expect(t.y).toBe(groundHeight(t.x, t.z)); expect([t.x, t.y, t.z, t.height, t.spread].every(Number.isFinite)).toBe(true); }
  });
  it('leaves both rooms, their passage and the back-window mountain sightline free of trunks', () => {
    for (const [x, z] of [[0, 0], [0, 10], [0, 20], [4.5, -7]]) expect(clearOfMuseum(x, z)).toBe(false);
    for (const t of forestSites()) expect(t.z < -10 && t.z > -48 && Math.abs(t.x) < 7).toBe(false);
  });
  it('keeps the leaf crowns outside the gallery and conservatory walls', () => {
    for (const t of forestSites()) expect(clearOfMuseum(t.x, t.z, t.spread * 2.25)).toBe(true);
  });
  it('contains different depths with the expected parallax when the camera moves sideways', () => {
    const camera = new THREE.PerspectiveCamera(62, 16 / 9, .1, 480); camera.position.set(0, 1.72, 6); camera.updateMatrixWorld();
    const near = new THREE.Vector3(7, 3, -10), far = new THREE.Vector3(70, 30, -150);
    const nearBefore = near.clone().project(camera).x, farBefore = far.clone().project(camera).x;
    camera.position.x = 1; camera.updateMatrixWorld();
    expect(Math.abs(near.clone().project(camera).x - nearBefore)).toBeGreaterThan(Math.abs(far.clone().project(camera).x - farBefore) * 5);
    const distances = forestSites().map(t => Math.hypot(t.x, t.z)); expect(Math.max(...distances) - Math.min(...distances)).toBeGreaterThan(60);
  });
  it('keeps the pavilion foundation level and produces a finite continuous descending hillside', () => {
    expect(groundHeight(0, 0)).toBe(-.22); expect(groundHeight(5, 8)).toBe(-.22);
    expect(groundHeight(60, 0)).toBeLessThan(-4);
    for (let x = -150; x <= 150; x += 5) { expect(Number.isFinite(groundHeight(x, -50))).toBe(true); expect(Math.abs(groundHeight(x + .01, -50) - groundHeight(x, -50))).toBeLessThan(.01); }
  });
  it('seeds are repeatable without changing global random state', () => {
    const a = seededRandom(7), b = seededRandom(7); for (let i = 0; i < 20; i++) { const v = a(); expect(v).toBe(b()); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
    expect(forestSites(1)).not.toEqual(forestSites(2));
  });
});
