import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePrivateMedia } from '../media';
import { BIRTHDAY } from './layout';
import BadtzTopper from './BadtzTopper';
import AnimatedCandle from './AnimatedCandle';
import { LeafCloud } from './architecture';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
function Grass() {
  const geometry = useMemo(() => {
    const positions: number[] = [], colors: number[] = []; const c = new THREE.Color();
    for (let i = 0; i < 1900; i++) {
      const a = i * 2.39996323, r = Math.sqrt(((i * 97) % 1900) / 1900) * 1.65;
      if (r < 0.82) continue;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const height = 0.12 + ((i * 37) % 100) / 500, width = 0.012 + (i % 3) * 0.004;
      const dx = Math.cos(a * 3) * width, dz = Math.sin(a * 3) * width;
      positions.push(x - dx, .065, z - dz, x + dx, .065, z + dz, x + Math.sin(i) * .08, height, z + Math.cos(i) * .08);
      c.setHSL(0.20 + (i % 9) * .006, .4, .15 + (i % 6) * .015);
      for (let j = 0; j < 3; j++) colors.push(c.r, c.g, c.b);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); g.computeVertexNormals(); return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={1} /></mesh>;
}
function OchnaFlowers() {
  const geometry = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [], sphere = new THREE.SphereGeometry(1, 8, 6), transform = new THREE.Object3D();
    const add = (position: THREE.Vector3, scale: [number, number, number], tint: string, rotation = 0) => {
      const g = sphere.clone(); transform.position.copy(position); transform.scale.set(...scale); transform.rotation.set(.6, 0, rotation); transform.updateMatrix(); g.applyMatrix4(transform.matrix);
      const c = new THREE.Color(tint), colors: number[] = []; for (let j = 0; j < g.getAttribute('position').count; j++) colors.push(c.r, c.g, c.b); g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); parts.push(g);
    };
    for (let i = 0; i < 30; i++) {
      const a = i * 2.399, r = 1.1 + (i % 4) * .13, x = Math.cos(a) * r, z = Math.sin(a) * r, h = .34 + (i % 4) * .055, yellow = i % 5 === 0;
      add(new THREE.Vector3(x, h / 2, z), [.009, h / 2, .009], '#536743');
      for (const side of [-1, 1]) add(new THREE.Vector3(x + side * .075, h * .5, z), [.12, .035, .045], '#59704b', side * .45);
      for (let j = 0; j < 5; j++) { const p = j / 5 * Math.PI * 2; add(new THREE.Vector3(x + Math.sin(p) * .06, h + Math.cos(p) * .05, z), [.042, .073, .014], yellow ? '#e4c76e' : '#ad503d', -p); }
      for (const [bx, by] of yellow ? [[0, 0]] : [[-.038, .025], [.04, .025], [0, -.035]]) add(new THREE.Vector3(x + bx, h + by, z + .035), [.026, .026, .026], yellow ? '#b39a44' : '#171e1a');
    }
    sphere.dispose(); const merged = mergeGeometries(parts); parts.forEach(p => p.dispose()); return merged;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={[0, .06, 0]}><meshStandardMaterial vertexColors roughness={.72} /></mesh>;
}
function Meadow() {
  return <group>
    <mesh position={[0, .04, 0]} receiveShadow><cylinderGeometry args={[BIRTHDAY.meadowRadius, BIRTHDAY.meadowRadius, .065, 80]} /><meshStandardMaterial color="#51583c" roughness={1} /></mesh>
    <mesh position={[0, .025, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.72, .018, 6, 80]} /><meshStandardMaterial color="#86774e" metalness={.4} roughness={.55} /></mesh>
    <Grass /><LeafCloud />
    <OchnaFlowers />
  </group>;
}
function Decoration({ path }: { path: string }) {
  const { url } = usePrivateMedia(path); const [texture, setTexture] = useState<THREE.Texture>();
  useEffect(() => { if (!url) return; let alive = true; let asset: THREE.Texture | undefined; new THREE.TextureLoader().load(url, t => { asset = t; t.colorSpace = THREE.SRGBColorSpace; if (alive) setTexture(t); else t.dispose(); }); return () => { alive = false; asset?.dispose(); }; }, [url]);
  return texture ? <mesh position={[0, 2.46, .02]}><planeGeometry args={[.46, .52]} /><meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} /></mesh> : <BadtzTopper />;
}
function CakeDisplay({ decorationPath, reduced, out }: { decorationPath?: string; reduced: boolean; out: boolean }) {
  const light = useRef<THREE.PointLight>(null), ring = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ camera, clock }, delta) => {
    const distance = Math.hypot(camera.position.x, camera.position.z - BIRTHDAY.centerZ);
    if (ring.current) ring.current.emissiveIntensity = THREE.MathUtils.damp(ring.current.emissiveIntensity, distance < 3.5 ? .32 : .05, 2, .016);
    if (light.current) light.current.intensity = THREE.MathUtils.damp(light.current.intensity, out ? 0 : reduced ? .6 : .6 + Math.sin(clock.elapsedTime * 3) * .06, out ? 3 : 10, delta);
  });
  return <group>
    <mesh position={[0, .57, 0]} castShadow receiveShadow><cylinderGeometry args={[.68, .78, 1.02, 64]} /><meshStandardMaterial color="#d2cbb6" roughness={.6} /></mesh>
    {Array.from({ length: 32 }, (_, i) => { const a = i / 32 * Math.PI * 2; return <mesh key={i} position={[Math.sin(a) * .71, .56, Math.cos(a) * .71]}><cylinderGeometry args={[.022, .022, .92, 5]} /><meshStandardMaterial color="#beb69d" /></mesh>; })}
    <mesh position={[0, 1.12, 0]} castShadow><cylinderGeometry args={[.9, .9, .1, 64]} /><meshStandardMaterial color="#f0e5ce" roughness={.32} /></mesh>
    <mesh position={[0, 1.19, 0]}><cylinderGeometry args={[.69, .69, .035, 64]} /><meshStandardMaterial ref={ring} color="#b99b62" metalness={.65} roughness={.3} emissive="#b99b62" emissiveIntensity={.05} /></mesh>
    <mesh position={[0, 1.49, 0]} castShadow><cylinderGeometry args={[.63, .63, .56, 64]} /><meshStandardMaterial color="#eee7d6" roughness={.72} /></mesh>
    <mesh position={[0, 1.29, 0]}><cylinderGeometry args={[.635, .635, .085, 64]} /><meshStandardMaterial color="#303c36" roughness={.68} /></mesh>
    <mesh position={[0, 1.96, 0]} castShadow><cylinderGeometry args={[.425, .425, .36, 64]} /><meshStandardMaterial color="#efe7d5" roughness={.7} /></mesh>
    <mesh position={[0, 1.83, 0]}><cylinderGeometry args={[.43, .43, .07, 64]} /><meshStandardMaterial color="#303c36" roughness={.6} /></mesh>
    <mesh position={[0, 2.147, 0]}><cylinderGeometry args={[.43, .43, .025, 64]} /><meshStandardMaterial color="#eee3cc" /></mesh>
    {Array.from({ length: 24 }, (_, i) => { const a = i / 24 * Math.PI * 2; return <mesh key={i} position={[Math.sin(a) * .63, 1.37, Math.cos(a) * .63]}><sphereGeometry args={[.018, 8, 6]} /><meshStandardMaterial color="#c1a468" metalness={.25} /></mesh>; })}
    {decorationPath ? <Decoration path={decorationPath} /> : <BadtzTopper />}
    {[-1, 1].map(side => <AnimatedCandle key={side} side={side} out={out} reduced={reduced} />)}
    <pointLight ref={light} position={[0, 2.25, .4]} intensity={.35} color="#ffd391" distance={4} />
  </group>;
}

export default function BirthdayInstallation(props: { decorationPath?: string; reduced: boolean; out: boolean }) {
  return <group name="birthday-installation"><Meadow /><CakeDisplay {...props} /></group>;
}
