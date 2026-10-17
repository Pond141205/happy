import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { archedOutline, GLASS } from './conservatoryGeometry';
export function Box({ at, size, color, metalness = 0 }: { at: [number, number, number]; size: [number, number, number]; color: string; metalness?: number }) {
  return <mesh position={at} receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} metalness={metalness} roughness={metalness ? .38 : .75} /></mesh>;
}
export function Arch({ radius = 1.4, spring = 3.3, z = 0 }: { radius?: number; spring?: number; z?: number }) {
  const geometry = useMemo(() => {
    const points = [new THREE.Vector3(-radius, 0, z), ...Array.from({ length: 49 }, (_, i) => { const a = Math.PI - i / 48 * Math.PI; return new THREE.Vector3(Math.cos(a) * radius, spring + Math.sin(a) * radius, z); }), new THREE.Vector3(radius, 0, z)];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, false, 'centripetal'), 100, .085, 8);
  }, [radius, spring, z]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}><meshStandardMaterial color="#ddcfaf" roughness={.5} /></mesh>;
}
export function GardenWindow({ position, width, height, rotation = 0, glass = true }: { position: [number, number, number]; width: number; height: number; rotation?: number; glass?: boolean }) {
  const geometry = useMemo(() => new THREE.ShapeGeometry(archedOutline(width, height), 32), [width, height]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group position={position} rotation={[0, rotation, 0]}>{glass && <mesh geometry={geometry} position={[0, 0, .025]}><meshPhysicalMaterial {...GLASS} /></mesh>}<Arch radius={width / 2 + .06} spring={height - width / 2} z={.06} /><Box at={[0, (height - width / 2) / 2, .08]} size={[.035, height - width / 2, .04]} color="#a18a56" metalness={.7} /><Box at={[0, height - width / 2, .08]} size={[width, .035, .04]} color="#a18a56" metalness={.7} /><Box at={[0, -.05, .09]} size={[width + .2, .1, .23]} color="#c7bba0" /></group>;
}
export function Conservatory({ glass = true }: { glass?: boolean }) {
  const [ribs, stars] = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (let j = 0; j < 16; j++) { const a = j / 16 * Math.PI * 2, p = Array.from({ length: 25 }, (_, i) => { const t = i / 24 * Math.PI / 2; return new THREE.Vector3(Math.cos(a) * 4.9 * Math.cos(t), 5.5 + 2.8 * Math.sin(t), Math.sin(a) * 7.9 * Math.cos(t)); }); parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p), 24, .028, 5)); }
    for (const t of [0, .33, .66, 1.03]) { const p = Array.from({ length: 65 }, (_, i) => { const a = i / 64 * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * 4.9 * Math.cos(t), 5.5 + 2.8 * Math.sin(t), Math.sin(a) * 7.9 * Math.cos(t)); }); parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p), 64, .025, 5)); }
    const g = mergeGeometries(parts); parts.forEach(p => p.dispose());
    const dots: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 88; i++) { const a = i * 2.39996, t = .18 + (i % 17) / 17 * .9, p = new THREE.SphereGeometry(.012, 5, 4); p.translate(Math.cos(a) * 4.87 * Math.cos(t), 5.49 + 2.77 * Math.sin(t), Math.sin(a) * 7.87 * Math.cos(t)); dots.push(p); }
    const d = mergeGeometries(dots); dots.forEach(p => p.dispose()); return [g, d];
  }, []);
  useEffect(() => () => { ribs.dispose(); stars.dispose(); }, [ribs, stars]);
  return <group name="transparent-conservatory-dome">{glass && <mesh position={[0, 5.5, 0]} scale={[5.05, 2.85, 8.05]}><sphereGeometry args={[1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshPhysicalMaterial {...GLASS} /></mesh>}<mesh geometry={ribs}><meshStandardMaterial color="#9b855b" roughness={.4} metalness={.7} /></mesh><mesh geometry={stars}><meshBasicMaterial color="#ffe1a3" /></mesh></group>;
}
export function BotanicalVines() {
  const geometry = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (let j = 0; j < 8; j++) {
      const side = j % 2 ? 1 : -1, base = [-6, -2, 2, 6][Math.floor(j / 2)];
      const points = Array.from({ length: 30 }, (_, i) => { const t = i / 29; return new THREE.Vector3(side * (4.61 - .12 * Math.sin(t * 9)), .42 + t * 4.5, base + Math.sin(t * 7 + j) * .26); });
      parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, .018, 5));
    }
    const g = mergeGeometries(parts); parts.forEach(p => p.dispose()); return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}><meshStandardMaterial color="#4a5c35" roughness={.95} /></mesh>;
}
export function LeafCloud({ wall = false }: { wall?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null), count = wall ? 460 : 480;
  useEffect(() => {
    const m = ref.current!, dummy = new THREE.Object3D(), color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996;
      if (wall) { const j = i % 8, side = j % 2 ? 1 : -1, z = [-6, -2, 2, 6][Math.floor(j / 2)], t = Math.floor(i / 8) / Math.floor(count / 8); dummy.position.set(side * (4.6 - .12 * Math.sin(t * 9)), .5 + t * 4.4, z + Math.sin(t * 7 + j) * .26 + (i % 2 ? .1 : -.1)); }
      else { const r = .9 + ((i * 31) % 100) / 100 * .74; dummy.position.set(Math.cos(a) * r, .13 + (i % 7) * .025, Math.sin(a) * r); }
      dummy.rotation.set(a, a * 3, a * .7); dummy.scale.set(wall ? .1 : .07, wall ? .22 : .16, .018); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); color.setHSL(.25 + (i % 5) * .012, .35 + (i % 3) * .045, .12 + (i % 7) * .01); m.setColorAt(i, color);
    }
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.computeBoundingSphere();
  }, [count, wall]);
  return <instancedMesh ref={ref} args={[undefined, undefined, count]}><sphereGeometry args={[1, 7, 5]} /><meshStandardMaterial roughness={.88} /></instancedMesh>;
}
