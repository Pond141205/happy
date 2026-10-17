import { useEffect, useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Box, Arch, GardenWindow, Conservatory, LeafCloud, BotanicalVines } from './architecture';

export function Parquet() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#493727'; ctx.fillRect(0, 0, 1024, 1024);
    // Two perpendicular boards tile a herringbone lattice, with no coplanar floor meshes.
    for (let a = -12; a < 12; a++) for (let b = -38; b < 38; b++) {
      const x = (a * 4 - b) * 32, y = (a * 4 + b) * 32, seed = Math.sin(a * 37 + b * 17) * .5 + .5;
      for (let d = 0; d < 2; d++) {
        ctx.save(); ctx.translate(x + (d ? 160 : 0), y); if (d) ctx.rotate(Math.PI / 2);
        ctx.fillStyle = `hsl(29 27% ${29 + seed * 5}%)`; ctx.fillRect(.35, .35, 127.3, 31.3);
        for (let j = 0; j < 12; j++) { ctx.strokeStyle = `rgba(36,21,12,${.035 + (j % 4) * .015})`; ctx.beginPath(); ctx.moveTo(2, j * 2.7 + 2); ctx.bezierCurveTo(32, j * 2.7 + seed * 3, 85, j * 2.7 + 3, 126, j * 2.7 + 1); ctx.stroke(); }
        ctx.restore();
      }
    }
    const t = new THREE.CanvasTexture(canvas); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.5, 4); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .012, 0]} receiveShadow><planeGeometry args={[10, 16]} /><meshStandardMaterial map={texture} color="#ddd1b9" roughness={.46} metalness={.08} /></mesh>;
}
function Vault() {
  const [ceiling, ribs] = useMemo(() => {
    const positions: number[] = [], indices: number[] = [], parts: THREE.BufferGeometry[] = [];
    for (let j = 0; j <= 48; j++) { const a = j / 48 * Math.PI; positions.push(5 * Math.cos(a), 5.45 + 2.45 * Math.sin(a), -8, 5 * Math.cos(a), 5.45 + 2.45 * Math.sin(a), 8); if (j < 48) { const i = j * 2; indices.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setIndex(indices); g.computeVertexNormals();
    for (const z of [-7.7, -4, 0, 4, 7.7]) { const points = Array.from({ length: 49 }, (_, i) => { const a = i / 48 * Math.PI; return new THREE.Vector3(4.97 * Math.cos(a), 5.43 + 2.43 * Math.sin(a), z); }); parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, .055, 5)); }
    for (const a of [.3, .62, .95, 1.28, 1.86, 2.19, 2.52, 2.84]) { const box = new THREE.BoxGeometry(.045, .065, 15.7); box.translate(4.98 * Math.cos(a), 5.43 + 2.43 * Math.sin(a), 0); parts.push(box); }
    const merged = mergeGeometries(parts); parts.forEach(p => p.dispose()); return [g, merged];
  }, []);
  useEffect(() => () => { ceiling.dispose(); ribs.dispose(); }, [ceiling, ribs]);
  return <><mesh geometry={ceiling}><meshStandardMaterial color="#ece5d3" side={THREE.DoubleSide} roughness={.92} /></mesh><mesh geometry={ribs}><meshStandardMaterial color="#c6bca7" roughness={.7} /></mesh></>;
}
function AfternoonLight() {
  const geometry = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (const z of [-5.7, -2, 2, 5.7]) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([4.84, 4.9, z - 1, 4.84, 4.9, z + 1, -2.8, .04, z - 1.7, -2.8, .04, z - 3.7], 3));
      g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); parts.push(g);
    }
    const g = mergeGeometries(parts); parts.forEach(p => p.dispose()); return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} renderOrder={2}><meshBasicMaterial color="#ffe6ae" transparent opacity={.025} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>;
}
function EndWall({ z, warm, opening }: { z: number; warm: boolean; opening: boolean }) {
  const geometry = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(-5.12, 0);
    if (opening) { s.lineTo(-1.4, 0); s.lineTo(-1.4, 3.3); s.absarc(0, 3.3, 1.4, Math.PI, 0, true); s.lineTo(1.4, 0); }
    s.lineTo(5.12, 0); s.lineTo(5.12, 8.4); s.lineTo(-5.12, 8.4); s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: .18, bevelEnabled: false, curveSegments: 40 });
  }, [opening]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const face = z > 0 ? -.13 : .24;
  return <group position={[0, 0, z]}>
    <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={warm ? '#293d35' : '#65705a'} roughness={.9} /></mesh>
    {opening && <Arch radius={1.4} spring={3.3} z={face} />}
    {[-1, 1].map(s => <group key={s}><Box at={[s * 3.25, .57, face]} size={[3.55, 1.14, .12]} color="#d8d0bc" /><Box at={[s * 3.25, 1.18, face]} size={[3.55, .09, .17]} color="#eee4ce" /></group>)}
    {!opening && <GardenWindow position={[0, 1.5, .3]} width={3.3} height={3.8} />}
  </group>;
}
export default function GalleryShell({ children, warm = false }: { children?: ReactNode; warm?: boolean }) {
  const target = useMemo(() => { const o = new THREE.Object3D(); o.position.set(warm ? 0 : -1, warm ? 1.2 : 0, warm ? 0 : -2); return o; }, [warm]);
  return <group name={warm ? 'conservatory-salon' : 'vaulted-memory-hall'}>
    <Parquet />{!warm && <AfternoonLight />}<Box at={[0, -.08, 0]} size={[10.2, .16, 16.2]} color="#463d30" />
    <EndWall z={7.92} warm={warm} opening /><EndWall z={-7.98} warm={warm} opening={!warm} />
    {[-1, 1].map(side => <group key={side}>
      <Box at={[side * 5.08, 2.75, 0]} size={[.16, 5.5, 16]} color={warm ? '#30473c' : '#65705a'} />
      <Box at={[side * 4.96, .56, 0]} size={[.12, 1.1, 16]} color="#d5cdb9" />
      {[.1, 1.13, 1.23, 5.23, 5.38, 5.5].map((y, i) => <Box key={y} at={[side * (4.9 - (i > 2 ? .04 * (i - 2) : 0)), y, 0]} size={[.16, i > 2 ? .12 : .05, 16]} color="#e7deca" />)}
      {[-7.6, -4, 0, 4, 7.6].map(z => <group key={z}><Box at={[side * 4.85, 2.9, z]} size={[.23, 4.5, .3]} color="#d5cebb" /><Box at={[side * 4.78, 1.4, z]} size={[.34, .3, .43]} color="#e9dfc8" /><Box at={[side * 4.78, 5.05, z]} size={[.37, .27, .53]} color="#e9dfc8" /></group>)}
      {warm ? [-5.7, -2, 2, 5.7].map(z => <GardenWindow key={z} position={[side * 4.96, 1.6, z]} rotation={side * -Math.PI / 2} width={2.2} height={3.25} />) : [-5.7, -2, 2, 5.7].map(z => <group key={z} position={[side * 4.89, 4.58, z]} rotation={[0, side * -Math.PI / 2, 0]}><Box at={[0, 0, -.025]} size={[2.45, .82, .045]} color="#d9cbb0" /><mesh><planeGeometry args={[2.3, .67]} /><meshBasicMaterial color="#f7e8c3" /></mesh><Box at={[0, 0, .015]} size={[.04, .67, .04]} color="#8e8164" /></group>)}
    </group>)}
    {warm ? <><Conservatory /><BotanicalVines /><LeafCloud wall />{[-1, 1].map(s => [-6, -2, 2, 6].map(z => <mesh key={`${s}-${z}`} position={[s * 4.65, .27, z]}><cylinderGeometry args={[.32, .24, .52, 12]} /><meshStandardMaterial color="#a6987e" roughness={.8} /></mesh>))}</> : <><Vault /><Box at={[0, .02, 0]} size={[.018, .004, 15.8]} color="#bba36c" metalness={.7} /><group position={[-3.65, 0, .05]}><Box at={[0, .51, 0]} size={[.72, .16, 2.4]} color="#736043" />{[-.85, .85].map(z => <Box key={z} at={[0, .25, z]} size={[.53, .5, .1]} color="#3d3c31" metalness={.3} />)}<Box at={[0, .615, 0]} size={[.68, .075, 2.32]} color="#ac9d78" /></group></>}
    <primitive object={target} /><spotLight position={warm ? [1.8, 6, 2] : [4.3, 5.4, 2.8]} target={target} angle={warm ? .68 : .8} penumbra={.65} intensity={warm ? 100 : 155} distance={22} color={warm ? '#ffddb0' : '#ffe1a0'} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-.0005} shadow-normalBias={.035} />
    <pointLight position={[0, 4.8, -5]} intensity={warm ? 18 : 26} distance={13} color={warm ? '#e4ccaa' : '#fff0cc'} />
    {warm && <pointLight position={[0, 5, 0]} intensity={23} distance={14} color="#9daecb" />}
    {children}
  </group>;
}
