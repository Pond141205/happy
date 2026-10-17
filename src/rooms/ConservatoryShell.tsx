import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Parquet } from './GalleryShell';
import { Arch, BotanicalVines, Box, Conservatory, GardenWindow, LeafCloud } from './architecture';
import { BACK_WINDOWS, SIDE_WINDOWS, conservatoryGlassGeometry, conservatoryRoofGeometry, GLASS, windowWall } from './conservatoryGeometry';
import { BIRTHDAY } from './layout';

function Glazing() {
  const { gl, scene } = useThree(), mesh = useRef<THREE.Mesh>(null), frames = useRef(0), captured = useRef(false);
  const resources = useMemo(() => ({
    geometry: conservatoryGlassGeometry(), material: new THREE.MeshPhysicalMaterial(GLASS),
    cube: new THREE.WebGLCubeRenderTarget(128, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter }),
    reflection: undefined as THREE.WebGLRenderTarget | undefined,
  }), []);
  useFrame(() => {
    if (captured.current || ++frames.current < 3 || !mesh.current) return;
    // One local reflection probe captures the real forest/room. The glass hides only during its own capture.
    const camera = new THREE.CubeCamera(.1, 500, resources.cube); camera.position.set(0, 2.6, BIRTHDAY.centerZ);
    mesh.current.visible = false;
    const generator = new THREE.PMREMGenerator(gl);
    try { camera.update(gl, scene); resources.reflection = generator.fromCubemap(resources.cube.texture); resources.material.envMap = resources.reflection.texture; resources.material.needsUpdate = true; captured.current = true; }
    finally { mesh.current.visible = true; generator.dispose(); }
  });
  useEffect(() => () => { resources.geometry.dispose(); resources.material.dispose(); resources.cube.dispose(); resources.reflection?.dispose(); }, [resources]);
  return <mesh ref={mesh} name="conservatory-clear-glazing" geometry={resources.geometry} material={resources.material} />;
}

export default function ConservatoryShell({ children }: { children: ReactNode }) {
  const roof = useMemo(conservatoryRoofGeometry, []);
  useEffect(() => () => roof.dispose(), [roof]);
  const [side, back, front, target] = useMemo(() => {
    const entrance = new THREE.Shape(); entrance.moveTo(-5.15, 0); entrance.lineTo(-1.4, 0); entrance.lineTo(-1.4, 3.3); entrance.absarc(0, 3.3, 1.4, Math.PI, 0, true); entrance.lineTo(1.4, 0); entrance.lineTo(5.15, 0); entrance.lineTo(5.15, 5.5); entrance.lineTo(-5.15, 5.5); entrance.closePath();
    const front = new THREE.ExtrudeGeometry(entrance, { depth: .18, bevelEnabled: false, curveSegments: 32 });
    const target = new THREE.Object3D(); target.position.set(0, 0, 0);
    return [windowWall(16.2, 5.5, SIDE_WINDOWS), windowWall(10.3, 5.5, BACK_WINDOWS), front, target];
  }, []);
  useEffect(() => () => { side.dispose(); back.dispose(); front.dispose(); }, [side, back, front]);
  return <group name="open-glazed-forest-conservatory">
    <Parquet /><Box at={[0, -.08, 0]} size={[10.2, .16, 16.2]} color="#463d30" />
    <mesh geometry={back} position={[0, 0, -8.08]} receiveShadow castShadow><meshStandardMaterial color="#30473a" roughness={.85} side={THREE.DoubleSide} /></mesh>
    <mesh geometry={front} position={[0, 0, 7.96]} receiveShadow castShadow><meshStandardMaterial color="#30473a" roughness={.85} side={THREE.DoubleSide} /></mesh>
    <Arch radius={1.4} spring={3.3} z={7.83} />
    {BACK_WINDOWS.map(o => <GardenWindow key={o.center} position={[o.center, o.bottom, -7.84]} width={o.width} height={o.height} glass={false} />)}
    {[-1, 1].map(s => <group key={s}>
      <mesh geometry={side} position={[s * 5.08, 0, 0]} rotation={[0, s * -Math.PI / 2, 0]} receiveShadow castShadow><meshStandardMaterial color="#354d3f" roughness={.85} side={THREE.DoubleSide} /></mesh>
      <Box at={[s * 4.94, .4, 0]} size={[.12, .8, 16]} color="#d5cdb9" />
      {[.1, .83, 5.22, 5.38, 5.5].map(y => <Box key={y} at={[s * 4.88, y, 0]} size={[.2, y > 5 ? .12 : .05, 16]} color="#e7deca" />)}
      {[-7.7, -4, 0, 4, 7.7].map(z => <group key={z}><Box at={[s * 4.83, 2.8, z]} size={[.24, 4.5, .29]} color="#d5cebb" /><Box at={[s * 4.78, 5.05, z]} size={[.38, .28, .5]} color="#e9dfc8" /><Box at={[s * 4.78, .55, z]} size={[.38, 1.1, .4]} color="#e9dfc8" /></group>)}
      {SIDE_WINDOWS.map(o => <GardenWindow key={o.center} position={[s * 4.88, o.bottom, o.center]} rotation={s * -Math.PI / 2} width={o.width} height={o.height} glass={false} />)}
      <Box at={[s * 2.55, .4, -7.85]} size={[5.1, .8, .12]} color="#d5cdb9" /><Box at={[s * 2.55, .83, -7.8]} size={[5.1, .06, .19]} color="#e7deca" />
    </group>)}
    <mesh name="sealed-dome-shoulders" geometry={roof} castShadow receiveShadow><meshStandardMaterial color="#e7deca" roughness={.82} side={THREE.DoubleSide} /></mesh>
    <Conservatory glass={false} /><Glazing /><BotanicalVines /><LeafCloud wall />
    {[-1, 1].map(s => [-6, -2, 2, 6].map(z => <group key={`${s}-${z}`}><mesh position={[s * 4.65, .27, z]}><cylinderGeometry args={[.32, .24, .52, 16]} /><meshStandardMaterial color="#a6987e" roughness={.8} /></mesh><pointLight position={[s * 4.5, .35, z]} intensity={.65} color="#ffc278" distance={2.6} /></group>))}
    <primitive object={target} />
    <directionalLight position={[24, 14, -32]} target={target} intensity={2.3} color="#ffcf93" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-13} shadow-camera-right={13} shadow-camera-top={13} shadow-camera-bottom={-13} shadow-camera-near={.1} shadow-camera-far={75} shadow-bias={-.0003} shadow-normalBias={.03} />
    <spotLight position={[1.5, 6, 2]} target={target} intensity={65} color="#ffe3bb" angle={.65} penumbra={.8} distance={16} />
    <pointLight position={[0, 4.8, -5]} intensity={12} distance={13} color="#f8dfbb" />
    {children}
  </group>;
}
