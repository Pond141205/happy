import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type Opening = { center: number; bottom: number; width: number; height: number };
export const SIDE_WINDOWS: readonly Opening[] = [-5.7, -2, 2, 5.7].map(center => ({ center, bottom: .85, width: 2.65, height: 4.2 }));
export const BACK_WINDOWS: readonly Opening[] = [
  { center: -3.65, bottom: .85, width: 1.7, height: 4.1 },
  { center: 0, bottom: .85, width: 3.5, height: 4.5 },
  { center: 3.65, bottom: .85, width: 1.7, height: 4.1 },
];

export function archedOutline(width: number, height: number, bottom = 0, center = 0) {
  const r = width / 2, spring = bottom + height - r, s = new THREE.Shape();
  s.moveTo(center - r, bottom); s.lineTo(center + r, bottom); s.lineTo(center + r, spring);
  s.absarc(center, spring, r, 0, Math.PI, false); s.closePath(); return s;
}

export function windowWall(width: number, height: number, openings: readonly Opening[]) {
  const s = new THREE.Shape(); s.moveTo(-width / 2, 0); s.lineTo(width / 2, 0); s.lineTo(width / 2, height); s.lineTo(-width / 2, height); s.closePath();
  for (const o of openings) s.holes.push(new THREE.Path(archedOutline(o.width, o.height, o.bottom, o.center).getPoints(40)));
  return new THREE.ExtrudeGeometry(s, { depth: .18, bevelEnabled: false, curveSegments: 32 });
}

export function conservatoryGlassGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) for (const o of SIDE_WINDOWS) {
    const g = new THREE.ShapeGeometry(archedOutline(o.width, o.height), 32);
    g.rotateY(side * -Math.PI / 2); g.translate(side * 5.035, o.bottom, o.center); parts.push(g);
  }
  for (const o of BACK_WINDOWS) {
    const g = new THREE.ShapeGeometry(archedOutline(o.width, o.height), 32); g.translate(o.center, o.bottom, -7.965); parts.push(g);
  }
  const dome = new THREE.SphereGeometry(1, 64, 28, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.scale(5.05, 2.85, 8.05); dome.translate(0, 5.5, 0); parts.push(dome);
  const g = mergeGeometries(parts); parts.forEach(p => p.dispose()); return g;
}

// Shared by every pane and the dome; never contains a landscape image map.
export const GLASS = { color: '#ffffff', metalness: 0, roughness: .015, transmission: 1, thickness: .004, ior: 1.45, opacity: 1, envMapIntensity: .25, side: THREE.DoubleSide };
