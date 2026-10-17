import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function badtzHeadOutline() {
  const s = new THREE.Shape();
  s.moveTo(-.46, .65); s.bezierCurveTo(-.56, .79, -.55, 1.01, -.37, 1.09);
  s.lineTo(-.42, 1.26); s.lineTo(-.24, 1.16); s.lineTo(-.13, 1.34); s.lineTo(0, 1.19); s.lineTo(.14, 1.34); s.lineTo(.25, 1.16); s.lineTo(.43, 1.25); s.lineTo(.37, 1.08);
  s.bezierCurveTo(.55, 1.0, .56, .79, .46, .65); s.bezierCurveTo(.27, .51, -.27, .51, -.46, .65); s.closePath(); return s;
}
export function badtzGeometry() {
  const parts: Record<'black' | 'ivory' | 'gold' | 'ink', THREE.BufferGeometry[]> = { black: [], ivory: [], gold: [], ink: [] };
  const dummy = new THREE.Object3D(), sphere = new THREE.SphereGeometry(1, 24, 16);
  const ellipsoid = (material: keyof typeof parts, at: [number, number, number], scale: [number, number, number], tilt = 0) => {
    const g = sphere.clone(); dummy.position.set(...at); dummy.rotation.set(0, 0, tilt); dummy.scale.set(...scale); dummy.updateMatrix(); g.applyMatrix4(dummy.matrix); parts[material].push(g);
  };
  const head = new THREE.ExtrudeGeometry(badtzHeadOutline(), { depth: .28, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .035, bevelThickness: .035, curveSegments: 24 }); head.translate(0, 0, -.14); parts.black.push(head);
  ellipsoid('black', [0, .34, -.015], [.28, .34, .22]);
  ellipsoid('ivory', [0, .31, .196], [.17, .225, .034]);
  for (const side of [-1, 1]) {
    ellipsoid('black', [side * .3, .35, -.025], [.085, .235, .065], side * .34);
    ellipsoid('gold', [side * .14, .027, .07], [.125, .055, .15], -side * .12);
    // Flat upper lids and lowered pupils give the recognizable unimpressed expression.
    const eye = new THREE.Shape(); eye.moveTo(-.12, .025); eye.lineTo(.12, .045); eye.bezierCurveTo(.13, -.06, .065, -.12, -.015, -.12); eye.bezierCurveTo(-.09, -.12, -.13, -.07, -.12, .025); eye.closePath();
    const g = new THREE.ExtrudeGeometry(eye, { depth: .012, bevelEnabled: true, bevelSize: .004, bevelThickness: .004, bevelSegments: 2, curveSegments: 16 }); g.rotateZ(-side * .055); g.translate(side * .205, .925, .189); parts.ivory.push(g);
    ellipsoid('ink', [side * .158, .841, .213], [.032, .043, .013]);
  }
  const beak = new THREE.Shape(); beak.moveTo(-.145, .758); beak.quadraticCurveTo(-.085, .795, 0, .78); beak.quadraticCurveTo(.085, .795, .145, .758); beak.quadraticCurveTo(.085, .706, 0, .717); beak.quadraticCurveTo(-.085, .706, -.145, .758); beak.closePath();
  const bill = new THREE.ExtrudeGeometry(beak, { depth: .065, bevelEnabled: true, bevelSize: .007, bevelThickness: .007, bevelSegments: 2, curveSegments: 16 }); bill.translate(0, 0, .186); parts.gold.push(bill);
  const mouth = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.08, .744, .258), new THREE.Vector3(0, .739, .26), new THREE.Vector3(.08, .744, .258)]), 12, .0035, 4); parts.ink.push(mouth);
  sphere.dispose();
  const result = {} as Record<keyof typeof parts, THREE.BufferGeometry>;
  for (const material of Object.keys(parts) as (keyof typeof parts)[]) { const flat = parts[material].map(g => g.index ? g.toNonIndexed() : g); result[material] = mergeGeometries(flat); new Set([...flat, ...parts[material]]).forEach(g => g.dispose()); }
  return result;
}
