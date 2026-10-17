import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { archedOutline, BACK_WINDOWS, conservatoryGlassGeometry, conservatoryRoofGeometry, galleryEndGeometry, GLASS, SIDE_WINDOWS, windowWall } from './conservatoryGeometry';

function intersects(geometry: THREE.BufferGeometry, x: number, y: number) {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); mesh.updateMatrixWorld();
  const ray = new THREE.Raycaster(new THREE.Vector3(x, y, 2), new THREE.Vector3(0, 0, -1));
  const hit = ray.intersectObject(mesh).length > 0; mesh.material.dispose(); return hit;
}
describe('Actual conservatory openings', () => {
  it('seals the rectangular roof corners while leaving the dome opening transparent', () => {
    const g = conservatoryRoofGeometry(), material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), mesh = new THREE.Mesh(g, material); mesh.updateMatrixWorld();
    const hits = (x: number, z: number) => new THREE.Raycaster(new THREE.Vector3(x, 4, z), new THREE.Vector3(0, 1, 0)).intersectObject(mesh).length > 0;
    for (const x of [-4.95, 4.95]) for (const z of [-7.9, 7.9]) expect(hits(x, z)).toBe(true);
    for (const [x, z] of [[0, 0], [2, 2], [-2, -2]]) expect(hits(x, z)).toBe(false);
    g.computeBoundingBox(); expect(g.boundingBox!.min.y).toBeCloseTo(5.42); expect(g.boundingBox!.max.y).toBeCloseTo(5.58);
    g.dispose(); material.dispose();
  });
  it('has continuous roof coverage from the glass dome to all four walls', () => {
    const roof = conservatoryRoofGeometry(), glass = conservatoryGlassGeometry(), material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const meshes = [new THREE.Mesh(roof, material), new THREE.Mesh(glass, material)]; meshes.forEach(m => m.updateMatrixWorld());
    for (let x = -5; x <= 5; x += .5) for (let z = -8; z <= 8; z += .5) {
      const ray = new THREE.Raycaster(new THREE.Vector3(x, 5.3, z), new THREE.Vector3(0, 1, 0));
      expect(ray.intersectObjects(meshes).length, `roof at ${x}, ${z}`).toBeGreaterThan(0);
    }
    roof.dispose(); glass.dispose(); material.dispose();
  });
  it('closes the starting entrance but leaves the connecting doorway open', () => {
    const closed = galleryEndGeometry(false), passage = galleryEndGeometry(true);
    expect(intersects(closed, 0, 1.72)).toBe(true); expect(intersects(passage, 0, 1.72)).toBe(false);
    expect(intersects(passage, 0, 5)).toBe(true); closed.dispose(); passage.dispose();
  });
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
