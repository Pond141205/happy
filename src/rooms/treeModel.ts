import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom, type TreeSite } from './forestLayout';

export type TreeDetail = 0 | 1 | 2;
export type TwigCard = { center: THREE.Vector3; rotation: THREE.Euler; width: number; height: number; tile: number; shade: number };
type Branch = { from: THREE.Vector3; to: THREE.Vector3; radius: number; tip: number };
export const TREE_BUDGET = { nearDistance: 32, middleDistance: 62, nearLimit: 8, middleLimit: 40, cellSize: 64 } as const;

/** Reference tree: 12 m tall, irregular branching and photographed twig cards. */
export function treeStructure() {
  const random = seededRandom(936), branches: Branch[] = [], tips: THREE.Vector3[] = [];
  const trunk = (t: number) => new THREE.Vector3(Math.sin(t * 2.7) * .48, t * 11.7, Math.sin(t * 4.1) * .22);
  for (let i = 0; i < 10; i++) branches.push({ from: trunk(i / 10), to: trunk((i + 1) / 10), radius: .32 * Math.pow(1 - i / 11, 1.3), tip: .32 * Math.pow(1 - (i + 1) / 11, 1.3) });
  for (let i = 0; i < 27; i++) {
    const t = .38 + i / 27 * .53, angle = i * 2.39996 + random() * .5;
    const radius = (1.2 + Math.sin((t - .3) / .7 * Math.PI) * 2.35) * (.83 + random() * .28);
    const from = trunk(t), elbow = new THREE.Vector3(Math.cos(angle) * radius * .55, from.y + .65, Math.sin(angle) * radius * .55);
    const end = new THREE.Vector3(Math.cos(angle) * radius, from.y + 1.3 + random() * .55, Math.sin(angle) * radius);
    branches.push({ from, to: elbow, radius: .085 * (1 - t) + .035, tip: .035 }, { from: elbow, to: end, radius: .035, tip: .009 });
    tips.push(end);
    for (const side of [-1, 1]) {
      const twig = end.clone().add(new THREE.Vector3(Math.cos(angle + side * .7) * .7, .1 + random() * .55, Math.sin(angle + side * .7) * .7));
      branches.push({ from: elbow.clone().lerp(end, .5), to: twig, radius: .018, tip: .005 }); tips.push(twig);
    }
  }
  tips.push(trunk(1));
  return { branches, tips };
}

export function twigCards(detail: 0 | 1): TwigCard[] {
  const { tips } = treeStructure(), random = seededRandom(284);
  const cards: TwigCard[] = [];
  const count = detail === 0 ? 246 : 144;
  for (let i = 0; i < count; i++) {
    const tip = tips[(i * 37) % tips.length];
    const center = tip.clone().add(new THREE.Vector3((random() - .5) * 1.35, (random() - .5) * .95, (random() - .5) * 1.35));
    const size = (.85 + random() * .4) * (detail === 0 ? 1 : 1.45);
    cards.push({ center, rotation: new THREE.Euler((random() - .5) * 1.7, random() * Math.PI * 2, (random() - .5) * 1.6), width: size * 1.04, height: size * 2.05, tile: i % 2, shade: .8 + random() * .2 });
  }
  return cards;
}

export function treeGeometry(detail: 0 | 1) {
  const parts: THREE.BufferGeometry[] = [], dummy = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0);
  const branches = treeStructure().branches.filter((b, i) => detail === 0 || b.radius > .025 || i % 3 === 0);
  for (const b of branches) {
    const delta = b.to.clone().sub(b.from), g = new THREE.CylinderGeometry(b.tip, b.radius, delta.length(), detail === 0 ? 7 : 5, 1, false);
    const uv = g.getAttribute('uv'); for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * delta.length() * .55);
    dummy.position.copy(b.from).add(b.to).multiplyScalar(.5); dummy.quaternion.setFromUnitVectors(up, delta.normalize()); dummy.scale.setScalar(1); dummy.updateMatrix(); g.applyMatrix4(dummy.matrix); parts.push(g);
  }
  const wood = mergeGeometries(parts); parts.forEach(p => p.dispose());
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [], colors: number[] = [];
  for (const card of twigCards(detail)) {
    dummy.position.copy(card.center); dummy.rotation.copy(card.rotation); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
    const normal = card.center.clone().sub(new THREE.Vector3(0, 7.5, 0)).normalize(); normal.y = Math.max(.18, normal.y); normal.normalize();
    const segments = detail === 0 ? 2 : 1;
    const vertex = (x: number, y: number) => {
      const v = new THREE.Vector3((x - .5) * card.width, (y - .5) * card.height, Math.sin(y * Math.PI) * .13).applyMatrix4(dummy.matrix);
      positions.push(v.x, v.y, v.z); normals.push(normal.x, normal.y, normal.z); uvs.push((card.tile + x) * .5, y); colors.push(card.shade, card.shade, card.shade);
    };
    for (let j = 0; j < segments; j++) { const a = j / segments, b = (j + 1) / segments; vertex(0, a); vertex(1, a); vertex(1, b); vertex(0, a); vertex(1, b); vertex(0, b); }
  }
  const leaves = new THREE.BufferGeometry(); leaves.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); leaves.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3)); leaves.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); leaves.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return { wood, leaves };
}

export function treeDetails(sites: readonly TreeSite[], x: number, z: number, compact: boolean, previous?: readonly TreeDetail[]): TreeDetail[] {
  if (![x, z].every(Number.isFinite)) return sites.map(() => 2);
  let near = 0, middle = 0;
  const result: TreeDetail[] = sites.map(() => 2);
  sites.map((site, i) => ({ i, d: Math.hypot(site.x - x, site.z - z) })).sort((a, b) => a.d - b.d || a.i - b.i).forEach(({ i, d }) => {
    const nearRange = TREE_BUDGET.nearDistance + (previous?.[i] === 0 ? 3 : 0), midRange = TREE_BUDGET.middleDistance + (previous?.[i] === 1 ? 4 : 0);
    if (d < nearRange && near < (compact ? 6 : TREE_BUDGET.nearLimit)) { result[i] = 0; near++; }
    else if (d < midRange && middle < (compact ? 28 : TREE_BUDGET.middleLimit)) { result[i] = 1; middle++; }
  });
  return result;
}

export function forestCell(x: number, z: number) { return `${Math.floor((x + 32) / TREE_BUDGET.cellSize)},${Math.floor((z + 32) / TREE_BUDGET.cellSize)}`; }
export function impostorTile(tree: TreeSite, cameraX: number, cameraZ: number) {
  const angle = Math.atan2(cameraX - tree.x, cameraZ - tree.z) - tree.phase;
  return ((Math.round(angle / (Math.PI / 2)) % 4) + 4) % 4;
}
