import { useEffect, useMemo } from 'react';
import { badtzGeometry } from './badtzModel';
export default function BadtzTopper() {
  const geometry = useMemo(badtzGeometry, []);
  useEffect(() => () => Object.values(geometry).forEach(g => g.dispose()), [geometry]);
  return <group name="badtz-maru-fondant-topper" position={[0, 2.17, 0]} scale={.55}>
    <mesh geometry={geometry.black} castShadow><meshPhysicalMaterial color="#101516" roughness={.46} clearcoat={.18} clearcoatRoughness={.55} /></mesh>
    <mesh geometry={geometry.ivory}><meshStandardMaterial color="#fff9e7" roughness={.58} /></mesh>
    <mesh geometry={geometry.gold}><meshStandardMaterial color="#e7bb43" roughness={.5} /></mesh>
    <mesh geometry={geometry.ink}><meshStandardMaterial color="#080c0d" roughness={.35} /></mesh>
  </group>;
}
