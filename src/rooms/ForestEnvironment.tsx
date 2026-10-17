import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clearOfMuseum, forestSites, groundHeight, seededRandom } from './forestLayout';

function Mountain({ radius, height, color, seed }: { radius: number; height: number; color: string; seed: number }) {
  const geometry = useMemo(() => {
    const positions: number[] = [], indices: number[] = [], segments = 256, rings = 24;
    for (let j = 0; j <= rings; j++) for (let i = 0; i <= segments; i++) {
      const a = i / segments * Math.PI * 2, t = j / rings, r = radius - 24 + t * 65;
      const silhouette = height * (1 + .23 * Math.sin(a * 5 + seed) + .17 * Math.sin(a * 11 - seed) + .06 * Math.sin(a * 31));
      const y = -24 + Math.pow(Math.sin(t * Math.PI), 1.5) * silhouette;
      positions.push(Math.cos(a) * r, y, Math.sin(a) * r);
      if (j < rings && i < segments) { const k = j * (segments + 1) + i; indices.push(k, k + segments + 1, k + 1, k + 1, k + segments + 1, k + segments + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setIndex(indices); g.computeVertexNormals(); return g;
  }, [radius, height, seed]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}><meshStandardMaterial color={color} roughness={1} side={THREE.DoubleSide} fog={false} /></mesh>;
}
function MountainSky() {
  return <mesh name="continuous-sunset-sky" frustumCulled={false}>
    <sphereGeometry args={[410, 48, 24]} />
    <shaderMaterial side={THREE.BackSide} depthWrite={false} vertexShader={`varying vec3 vDirection; void main(){ vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`} fragmentShader={`
      varying vec3 vDirection;
      void main(){
        vec3 d=normalize(vDirection); float h=max(d.y,0.0);
        vec3 horizon=vec3(.68,.32,.16), zenith=vec3(.12,.29,.52);
        vec3 col=mix(horizon,zenith,smoothstep(0.0,.75,h));
        col=mix(vec3(.35,.44,.41),col,smoothstep(-.12,.025,d.y));
        vec3 sun=normalize(vec3(.65,.17,-.72)); float alignment=dot(d,sun);
        col+=vec3(.33,.15,.045)*pow(max(alignment,0.0),36.0);
        col=mix(col,vec3(2.5,1.75,.85),smoothstep(.99978,.99994,alignment));
        gl_FragColor=vec4(col,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`} />
  </mesh>;
}
function Ground() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(600, 600, 160, 160); g.rotateX(-Math.PI / 2);
    const p = g.getAttribute('position'), colors: number[] = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, groundHeight(x, z)); const noise = Math.sin(x * .32) * Math.cos(z * .24); c.setHSL(.23 + noise * .018, .22, .17 + noise * .025); colors.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); g.computeVertexNormals(); return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>;
}
function ForestTrees() {
  const foliage = useRef<THREE.InstancedMesh>(null);
  const sites = useMemo(() => forestSites(), []), perTree = 12;
  const [branches, cluster] = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [], cylinder = new THREE.CylinderGeometry(1, 1, 1, 7), dummy = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    const branch = (from: THREE.Vector3, to: THREE.Vector3, radius: number) => {
      const g = cylinder.clone(), direction = to.clone().sub(from); dummy.position.copy(from).add(to).multiplyScalar(.5); dummy.quaternion.setFromUnitVectors(up, direction.clone().normalize()); dummy.scale.set(radius, direction.length(), radius); dummy.updateMatrix(); g.applyMatrix4(dummy.matrix); parts.push(g);
    };
    for (const t of sites) {
      branch(new THREE.Vector3(t.x, t.y, t.z), new THREE.Vector3(t.x + Math.sin(t.phase) * .3, t.y + t.height * .88, t.z), .13 + t.height * .008);
      for (let j = 0; j < 6; j++) { const a = t.phase + j * 2.399, h = t.height * (.45 + j * .055); branch(new THREE.Vector3(t.x, t.y + h, t.z), new THREE.Vector3(t.x + Math.cos(a) * t.spread * .8, t.y + h + 2, t.z + Math.sin(a) * t.spread * .8), .045 + (6 - j) * .006); }
    }
    cylinder.dispose(); const wood = mergeGeometries(parts); parts.forEach(p => p.dispose());
    // A cluster is actual curved leaf geometry, shared by all tree crowns.
    const random = seededRandom(124), leafPositions: number[] = [], colors: number[] = [], color = new THREE.Color();
    for (let i = 0; i < 230; i++) {
      const a = random() * Math.PI * 2, r = Math.cbrt(random()), y = (random() * 2 - 1) * .7;
      dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r); dummy.rotation.set(random() * 3, random() * 6, random() * 3); dummy.scale.setScalar(.07 + random() * .08); dummy.updateMatrix();
      const leaf = [[0,-.8,0],[-.38,0,0],[0,1,.18],[0,-.8,0],[0,1,.18],[.38,0,0]];
      color.setHSL(.22 + random() * .06, .3 + random() * .15, .19 + random() * .08);
      for (const point of leaf) { const v = new THREE.Vector3(...point).applyMatrix4(dummy.matrix); leafPositions.push(v.x, v.y, v.z); colors.push(color.r, color.g, color.b); }
    }
    const leaves = new THREE.BufferGeometry(); leaves.setAttribute('position', new THREE.Float32BufferAttribute(leafPositions, 3)); leaves.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); leaves.computeVertexNormals(); return [wood, leaves];
  }, [sites]);
  useEffect(() => () => { branches.dispose(); cluster.dispose(); }, [branches, cluster]);
  useEffect(() => {
    const mesh = foliage.current!, dummy = new THREE.Object3D(), c = new THREE.Color(); let index = 0;
    for (const tree of sites) for (let j = 0; j < perTree; j++) {
      const a = j * 2.399 + tree.phase, ring = j < 9 ? 1 : .52, level = j < 9 ? .72 : .9;
      dummy.position.set(tree.x + Math.cos(a) * tree.spread * ring, tree.y + tree.height * level + Math.sin(a * 3) * .6, tree.z + Math.sin(a) * tree.spread * ring);
      dummy.rotation.set(.1 * j, a, .08 * j); dummy.scale.set(tree.spread * .9, tree.spread * .9, tree.spread * .9); dummy.updateMatrix(); mesh.setMatrixAt(index, dummy.matrix);
      c.setHSL(.22 + (j % 4) * .01, .25, .54 + (j % 5) * .06); mesh.setColorAt(index++, c);
    }
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere();
  }, [sites]);
  return <group name="spatial-forest-trees"><mesh geometry={branches}><meshStandardMaterial color="#66523c" roughness={1} /></mesh><instancedMesh ref={foliage} args={[cluster, undefined, sites.length * perTree]}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={1} /></instancedMesh></group>;
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
  return <group name="continuous-3d-mountain-forest"><MountainSky /><Ground /><Mountain radius={310} height={68} color="#8298ad" seed={2} /><Mountain radius={220} height={55} color="#708f99" seed={5} /><Mountain radius={145} height={40} color="#657f74" seed={8} /><ForestTrees /><Undergrowth /></group>;
}
