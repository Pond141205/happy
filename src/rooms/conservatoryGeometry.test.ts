import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { archedOutline, BACK_WINDOWS, conservatoryGlassGeometry, GLASS, SIDE_WINDOWS, windowWall } from './conservatoryGeometry';

function intersects(geometry: THREE.BufferGeometry, x: number, y: number) {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); mesh.updateMatrixWorld();
  const ray = new THREE.Raycaster(new THREE.Vector3(x, y, 2), new THREE.Vector3(0, 0, -1));
  const hit = ray.intersectObject(mesh).length > 0; mesh.material.dispose(); return hit;
}
describe('Actual conservatory openings', () => {
  for (const [name, width, openings] of [['side', 16.2, SIDE_WINDOWS], ['back', 10.3, BACK_WINDOWS]] as const) {
    it(`${name} wall lets sightlines through every window, but blocks between windows`, () => {
      const g = windowWall(width, 5.5, openings);
      for (const o of openings) {
        expect(intersects(g, o.center, o.bottom + o.height / 2)).toBe(false);
        expect(intersects(g, o.center, o.bottom + o.height - .1)).toBe(false);
        expect(intersects(g, o.center + o.width / 2 - .04, o.bottom + o.height - .1)).toBe(true);
      }
      expect(intersects(g, width / 2 - .03, 2)).toBe(true);
      expect(intersects(g, 0, .5)).toBe(true); g.dispose();
    });
  }
  it('glass covers side/back openings and the overhead view without an image material', () => {
    const g = conservatoryGlassGeometry(), material = new THREE.MeshPhysicalMaterial(GLASS), mesh = new THREE.Mesh(g, material); mesh.updateMatrixWorld();
    for (const s of [-1, 1]) for (const o of SIDE_WINDOWS) {
      const ray = new THREE.Raycaster(new THREE.Vector3(0, 2.5, o.center), new THREE.Vector3(s, 0, 0)); expect(ray.intersectObject(mesh).length).toBeGreaterThan(0);
    }
    expect(new THREE.Raycaster(new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, 1, 0)).intersectObject(mesh).length).toBeGreaterThan(0);
    expect(new THREE.Raycaster(new THREE.Vector3(0, 2.5, 0), new THREE.Vector3(0, 0, -1)).intersectObject(mesh).length).toBeGreaterThan(0);
    expect(material.map).toBeNull(); expect(material.transmission).toBe(1); expect(material.opacity).toBe(1); expect(material.roughness).toBeLessThan(.1);
    g.dispose(); material.dispose();
  });
  it('an arch has the specified bounds so its frame, wall opening and pane align', () => {
    const g = new THREE.ShapeGeometry(archedOutline(2.65, 3.9, 1.15, 2)); g.computeBoundingBox();
    expect(g.boundingBox!.min.x).toBeCloseTo(2 - 2.65 / 2); expect(g.boundingBox!.max.y).toBeCloseTo(5.05); g.dispose();
  });
});
