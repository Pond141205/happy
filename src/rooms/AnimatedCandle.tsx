import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BLOW_DURATION, candleAnimation } from './candleAnimation';
export default function AnimatedCandle({ side, out, reduced }: { side: number; out: boolean; reduced: boolean }) {
  const flame = useRef<THREE.Mesh>(null), smoke = useRef<THREE.Group>(null), elapsed = useRef(out ? BLOW_DURATION : 0), previous = useRef(out);
  useEffect(() => { if (out && !previous.current) elapsed.current = 0; previous.current = out; }, [out]);
  useFrame(({ clock }, dt) => {
    if (out && Number.isFinite(dt)) elapsed.current += Math.max(0, dt);
    const state = candleAnimation(elapsed.current, out, reduced), flicker = reduced ? 1 : 1 + Math.sin(clock.elapsedTime * 13 + side) * .09;
    if (flame.current) { flame.current.visible = state.flame > .001; flame.current.scale.set(flicker * state.flame, 1.7 * state.flame, state.flame); flame.current.rotation.z = -state.bend; flame.current.position.x = state.bend * .035; }
    smoke.current?.children.forEach((child, i) => { const puff = child as THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>; puff.visible = state.smoke > .005; puff.position.set(Math.sin(i * 2.3 + state.rise * 4) * state.rise * .09, .39 + state.rise * (.3 + i * .045), Math.cos(i * 1.8) * state.rise * .045); puff.scale.setScalar(.012 + state.rise * (.025 + i * .003)); puff.material.opacity = state.smoke * .24; });
  });
  return <group position={[side * .49, 1.76, .15]}>
    <mesh position={[0, .18, 0]}><cylinderGeometry args={[.014, .014, .36, 10]} /><meshStandardMaterial color="#bca471" /></mesh>
    <mesh position={[0, .365, 0]}><cylinderGeometry args={[.002, .002, .016, 5]} /><meshStandardMaterial color="#3a3023" /></mesh>
    <mesh ref={flame} position={[0, .39, 0]} scale={[1, 1.7, 1]}><sphereGeometry args={[.023, 10, 8]} /><meshBasicMaterial color="#ffda94" /></mesh>
    <group ref={smoke}>{Array.from({ length: 7 }, (_, i) => <mesh key={i} visible={false}><sphereGeometry args={[1, 6, 4]} /><meshBasicMaterial color="#ddd9c8" transparent opacity={0} depthWrite={false} /></mesh>)}</group>
  </group>;
}
