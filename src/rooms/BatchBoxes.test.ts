import { expect, it } from 'vitest';
import * as THREE from 'three';
import { batchStaticBoxes } from './BatchBoxes';
it('batches equal materials while retaining nested world transforms and restoring originals', () => {
  const root = new THREE.Group(); root.position.z = 24;
  const parent = new THREE.Group(); parent.position.x = 4; root.add(parent);
  const material = new THREE.MeshStandardMaterial({ color: '#abc123' });
  const a = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), material), b = a.clone(); b.position.z = 5;
  a.userData.batchable = b.userData.batchable = true; parent.add(a, b);
  const batch = batchStaticBoxes(root); expect(batch.before).toBe(2); expect(batch.after).toBe(1); expect(a.visible).toBe(false);
  const merged = root.children.find(c => c.name === 'batched-static-boxes') as THREE.Mesh; merged.geometry.computeBoundingBox();
  expect(merged.geometry.boundingBox!.min.toArray()).toEqual([3, -1, -1]); expect(merged.geometry.boundingBox!.max.toArray()).toEqual([5, 1, 6]);
  batch.dispose(); expect(a.visible).toBe(true); expect(root.children).toHaveLength(1); a.geometry.dispose(); material.dispose();
});
