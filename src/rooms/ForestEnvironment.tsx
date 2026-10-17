import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clearOfMuseum, groundHeight, seededRandom } from './forestLayout';
import ForestTrees from './ForestTrees';
import { useLoader, useThree } from '@react-three/fiber';
import { mountainBackdropGeometry, FOREST_LAYERS, FOREST_SECTORS, forestLayerHeight } from './mountainBackdrop';

function MountainBackdrop() {
  const source = useLoader(THREE.TextureLoader, `${import.meta.env.BASE_URL}images/environment/mountain-panorama.webp`);
  const geometry = useMemo(mountainBackdropGeometry, []);
  const texture = useMemo(() => { const t = source.clone(); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.MirroredRepeatWrapping; t.needsUpdate = true; return t; }, [source]);
  useEffect(() => () => { geometry.dispose(); texture.dispose(); }, [geometry, texture]);
  return <mesh name="photographic-distant-mountains" geometry={geometry} rotation={[0, Math.PI / 2, 0]} frustumCulled={false}><meshBasicMaterial map={texture} side={THREE.BackSide} depthWrite={false} fog={false} toneMapped={false} /></mesh>;
}
function ForestDepthLayers() {
  const source = useLoader(THREE.TextureLoader, `${import.meta.env.BASE_URL}images/environment/forest-ridges.webp`);
  const layers = useMemo(() => FOREST_LAYERS.map(layer => {
    const texture = source.clone(); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = THREE.MirroredRepeatWrapping;
    texture.repeat.set(FOREST_SECTORS, 1 / 3); texture.offset.y = (2 - layer.row) / 3; texture.needsUpdate = true;
    const height = forestLayerHeight(layer.radius), geometry = new THREE.CylinderGeometry(layer.radius, layer.radius, height, 96, 1, true);
    return { ...layer, height, texture, geometry };
  }), [source]);
  useEffect(() => () => layers.forEach(layer => { layer.texture.dispose(); layer.geometry.dispose(); }), [layers]);
  return <group name="layered-midground-forest">{layers.map(layer => <mesh key={layer.radius} geometry={layer.geometry} position={[0, layer.bottom + layer.height / 2, 0]} rotation={[0, .37 + layer.row * .61, 0]}>
    <meshBasicMaterial map={layer.texture} color={layer.tint} side={THREE.BackSide} alphaTest={.12} alphaToCoverage fog={false} toneMapped={false} />
  </mesh>)}</group>;
}
function Ground({ compact }: { compact: boolean }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(600, 600, compact ? 64 : 160, compact ? 64 : 160); g.rotateX(-Math.PI / 2);
    const p = g.getAttribute('position'), colors: number[] = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, groundHeight(x, z)); const noise = Math.sin(x * .32) * Math.cos(z * .24); c.setHSL(.23 + noise * .018, .22, .17 + noise * .025); colors.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); g.computeVertexNormals(); return g;
  }, [compact]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>;
}
function Undergrowth() {
  const rocks = useRef<THREE.InstancedMesh>(null), shrubs = useRef<THREE.InstancedMesh>(null);
  const fern = useMemo(() => {
    const positions: number[] = [], random = seededRandom(94);
    for (let plant = 0; plant < 140; plant++) {
      const a = random() * Math.PI * 2, r = 6.2 + random() * 15, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!clearOfMuseum(x, z, 1.25)) continue;
      const y = groundHeight(x, z), size = .6 + random() * .7;
      for (let f = 0; f < 7; f++) for (let j = 1; j < 10; j++) {
        const angle = f / 7 * Math.PI * 2 + a, t = j / 10, length = size * t, height = size * Math.sin(t * Math.PI * .85) * .65;
        const cx = x + Math.cos(angle) * length, cz = z + Math.sin(angle) * length, width = .16 * size * (1 - t);
        for (const side of [-1, 1]) { positions.push(cx, y + height, cz, cx - Math.sin(angle) * width * side - Math.cos(angle) * .07, y + height + .04, cz + Math.cos(angle) * width * side - Math.sin(angle) * .07, cx + Math.cos(angle) * .12, y + height + .025, cz + Math.sin(angle) * .12); }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.computeVertexNormals(); return g;
  }, []);
  useEffect(() => () => fern.dispose(), [fern]);
  useEffect(() => {
    const random = seededRandom(51), dummy = new THREE.Object3D(), c = new THREE.Color();
    for (const [ref, count, rocky] of [[rocks, 90, true], [shrubs, 180, false]] as const) {
      const mesh = ref.current!;
      for (let i = 0; i < count; i++) {
        let x = 0, z = 0;
        do { const a = random() * Math.PI * 2, r = 6 + random() * 28; x = Math.cos(a) * r; z = Math.sin(a) * r; } while (!clearOfMuseum(x, z, 1.25));
        const s = rocky ? .3 + random() * .7 : .3 + random() * .8;
        dummy.position.set(x, groundHeight(x, z) + s * .3, z); dummy.rotation.set(random(), random() * 6, random()); dummy.scale.set(s, s * (rocky ? .65 : .8), s * 1.2); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
        c.setHSL(rocky ? .12 : .25, rocky ? .08 : .26, rocky ? .29 + random() * .1 : .17 + random() * .07); mesh.setColorAt(i, c);
      }
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere();
    }
  }, []);
  return <group name="garden-foreground-depth"><mesh geometry={fern}><meshStandardMaterial color="#547347" side={THREE.DoubleSide} roughness={1} /></mesh><instancedMesh ref={rocks} args={[undefined, undefined, 90]} receiveShadow><dodecahedronGeometry args={[1, 1]} /><meshStandardMaterial roughness={.95} /></instancedMesh><instancedMesh ref={shrubs} args={[undefined, undefined, 180]}><icosahedronGeometry args={[1, 2]} /><meshStandardMaterial roughness={1} /></instancedMesh></group>;
}
export default function ForestEnvironment() {
  const size = useThree(s => s.size); const compact = window.matchMedia('(pointer: coarse)').matches || Math.min(size.width, size.height) <= 500;
  return <group name="continuous-3d-mountain-forest"><MountainBackdrop /><ForestDepthLayers /><Ground compact={compact} /><ForestTrees />{!compact && <Undergrowth />}</group>;
}
