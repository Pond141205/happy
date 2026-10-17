import * as THREE from 'three';
/** Four 90° photographic sectors, each 45° high: matching the source's 2:1 aspect. */
export const MOUNTAIN_SECTORS = 4;
export function panoramaV(elevation: number) { return THREE.MathUtils.clamp(.38 + elevation / (Math.PI / 4), 0, 1); }
export const FOREST_LAYERS = [
  { radius: 90, bottom: -13, row: 2, tint: '#c2cbb5' },
  { radius: 125, bottom: -22, row: 1, tint: '#becbc4' },
  { radius: 195, bottom: -37, row: 0, tint: '#c8d1d3' },
] as const;
export const FOREST_SECTORS = 3;
export function forestLayerHeight(radius: number) { return 2 * Math.PI * radius / FOREST_SECTORS / 6; }
export function mountainBackdropGeometry() {
  const geometry = new THREE.SphereGeometry(410, 96, 24), positions = geometry.getAttribute('position'), uv = geometry.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) {
    const horizon = Math.max(.001, Math.hypot(positions.getX(i), positions.getZ(i)));
    uv.setXY(i, uv.getX(i) * MOUNTAIN_SECTORS, panoramaV(Math.atan2(positions.getY(i), horizon)));
  }
  return geometry;
}
