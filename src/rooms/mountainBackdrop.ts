import * as THREE from 'three';
/** Photographic mountain belt; the top row extends smoothly into the overhead sky. */
export function mountainBackdropGeometry() {
  const geometry = new THREE.SphereGeometry(410, 64, 32), positions = geometry.getAttribute('position'), uv = geometry.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) {
    const horizon = Math.max(.001, Math.hypot(positions.getX(i), positions.getZ(i)));
    uv.setY(i, THREE.MathUtils.clamp((positions.getY(i) / horizon * 360 + 22) / 180, 0, 1));
  }
  return geometry;
}
