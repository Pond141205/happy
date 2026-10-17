import { useLayoutEffect, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export function batchStaticBoxes(root: THREE.Group) {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert(), originals: THREE.Mesh[] = [];
  const buckets = new Map<string, { parts: THREE.BufferGeometry[]; material: THREE.MeshStandardMaterial; cast: boolean; receive: boolean }>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh) || !object.userData.batchable || !(object.material instanceof THREE.MeshStandardMaterial)) return;
    const m = object.material, key = `${m.color.getHex()}/${m.roughness}/${m.metalness}/${object.castShadow}/${object.receiveShadow}`;
    if (!buckets.has(key)) buckets.set(key, { parts: [], material: m.clone(), cast: object.castShadow, receive: object.receiveShadow });
    buckets.get(key)!.parts.push(object.geometry.clone().applyMatrix4(inverse.clone().multiply(object.matrixWorld)));
    originals.push(object);
  });
  const merged: THREE.Mesh[] = [];
  for (const bucket of buckets.values()) { const geometry = mergeGeometries(bucket.parts); bucket.parts.forEach(g => g.dispose()); const mesh = new THREE.Mesh(geometry, bucket.material); mesh.castShadow = bucket.cast; mesh.receiveShadow = bucket.receive; mesh.name = 'batched-static-boxes'; root.add(mesh); merged.push(mesh); }
  originals.forEach(m => { m.visible = false; });
  return { before: originals.length, after: merged.length, dispose() { merged.forEach(m => { root.remove(m); m.geometry.dispose(); (m.material as THREE.Material).dispose(); }); originals.forEach(m => { m.visible = true; }); } };
}
export default function BatchBoxes({ children, name }: { children: ReactNode; name: string }) {
  const ref = useRef<THREE.Group>(null);
  const gl = useThree(s => s.gl);
  useLayoutEffect(() => { if (!ref.current) return; const batch = batchStaticBoxes(ref.current); if (import.meta.env.DEV) { gl.domElement.dataset[`${name === 'room-1-memory-gallery' ? 'hall' : 'cakeRoom'}Batch`] = `${batch.before}/${batch.after}`; } return () => batch.dispose(); }, [gl, name]);
  return <group ref={ref} name={name}>{children}</group>;
}
