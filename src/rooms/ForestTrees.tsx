import { useEffect, useMemo } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { forestSites } from './forestLayout';
import { forestCell, impostorTile, treeDetails, treeGeometry, type TreeDetail } from './treeModel';

const files = ['twigs.webp', 'bark.webp', 'bark-normal.webp', 'tree-views.webp'].map(name => `${import.meta.env.BASE_URL}textures/forest/${name}`);

export default function ForestTrees() {
  const source = useLoader(THREE.TextureLoader, files), { camera, gl, size } = useThree();
  const compact = window.matchMedia('(pointer: coarse)').matches || Math.min(size.width, size.height) <= 500;
  const resources = useMemo(() => {
    const [twig, bark, normal, impostor] = source.map(texture => texture.clone());
    for (const t of [twig, bark, impostor]) t.colorSpace = THREE.SRGBColorSpace;
    for (const t of [twig, bark, normal, impostor]) { t.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy()); t.needsUpdate = true; }
    bark.wrapS = bark.wrapT = normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
    const time = { value: 0 };
    const leaf = new THREE.MeshStandardMaterial({ map: twig, emissiveMap: twig, emissive: '#b4c487', emissiveIntensity: .16, color: '#e1e3c5', roughness: .88, metalness: 0, vertexColors: true, alphaTest: .42, alphaToCoverage: true, side: THREE.DoubleSide });
    leaf.onBeforeCompile = shader => {
      shader.uniforms.forestTime = time;
      shader.vertexShader = `uniform float forestTime;\n${shader.vertexShader}`.replace('#include <begin_vertex>', `#include <begin_vertex>
        float phase = instanceMatrix[3].x * .17 + instanceMatrix[3].z * .11;
        transformed.x += sin(forestTime * .65 + position.y * 1.3 + phase) * .045 * smoothstep(3.0, 11.0, position.y);
      `);
    };
    leaf.customProgramCacheKey = () => 'forest-leaf-wind-v1';
    const wood = new THREE.MeshStandardMaterial({ map: bark, normalMap: normal, normalScale: new THREE.Vector2(.55, .55), color: '#b8afa0', roughness: .94 });
    const far = new THREE.MeshBasicMaterial({ map: impostor, color: '#cdd3bc', alphaTest: .16, alphaToCoverage: true, side: THREE.DoubleSide, fog: true });
    far.onBeforeCompile = shader => { shader.vertexShader = `attribute vec2 instanceAtlas;\n${shader.vertexShader}`.replace('#include <uv_vertex>', '#include <uv_vertex>\n vMapUv = vMapUv * .5 + instanceAtlas;'); };
    far.customProgramCacheKey = () => 'forest-four-view-atlas-v1';
    const geometry = [treeGeometry(0), treeGeometry(1)];
    const sites = forestSites(), cells = new Map<string, number[]>();
    sites.forEach((site, i) => { const key = forestCell(site.x, site.z); if (!cells.has(key)) cells.set(key, []); cells.get(key)!.push(i); });
    const group = new THREE.Group(); group.name = 'textured-forest-lod-cells';
    const batches = [...cells.entries()].map(([cell, indices]) => {
      const levels = ([0, 1, 2] as const).map(detail => {
        const meshes: THREE.InstancedMesh[] = [];
        if (detail < 2) {
          meshes.push(new THREE.InstancedMesh(geometry[detail].wood, wood, indices.length), new THREE.InstancedMesh(geometry[detail].leaves, leaf, indices.length));
          meshes.forEach(mesh => { mesh.castShadow = detail === 0; mesh.receiveShadow = detail === 0; });
        } else {
          // Root-aligned plane matches the baked orthographic image (16 m field).
          const plane = new THREE.PlaneGeometry(16, 16); plane.translate(0, 16 * (490 / 512 - .5), 0);
          plane.setAttribute('instanceAtlas', new THREE.InstancedBufferAttribute(new Float32Array(indices.length * 2), 2));
          meshes.push(new THREE.InstancedMesh(plane, far, indices.length));
        }
        meshes.forEach((mesh, i) => { mesh.name = `forest-${cell}-lod${detail}-${i}`; mesh.count = 0; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(mesh); });
        return meshes;
      });
      return { indices, levels };
    });
    return { group, batches, sites, geometry, textures: [twig, bark, normal, impostor], materials: [leaf, wood, far], time, last: new THREE.Vector2(Infinity, Infinity), lastCompact: compact, elapsed: 1, details: undefined as TreeDetail[] | undefined };
  }, [source, gl]);
  useEffect(() => () => {
    resources.group.traverse(object => { if (object instanceof THREE.InstancedMesh) { if (object.material === resources.materials[2]) object.geometry.dispose(); object.dispose(); } });
    resources.geometry.forEach(g => { g.wood.dispose(); g.leaves.dispose(); }); resources.materials.forEach(m => m.dispose()); resources.textures.forEach(t => t.dispose());
  }, [resources]);
  useFrame((state, delta) => {
    resources.time.value = state.clock.elapsedTime;
    resources.elapsed += delta;
    const x = camera.position.x, z = camera.position.z + 20;
    // LOD work only after moving; turning the camera uses ordinary per-cell frustum culling.
    if (resources.details && (resources.elapsed < .35 || ((resources.last.x - x) ** 2 + (resources.last.y - z) ** 2 < .36 && resources.lastCompact === compact))) return;
    resources.elapsed = 0; resources.last.set(x, z); resources.lastCompact = compact;
    const details = treeDetails(resources.sites, x, z, compact, resources.details), dummy = new THREE.Object3D(), color = new THREE.Color();
    let triangleCount = 0, drawBatches = 0;
    for (const batch of resources.batches) for (const detail of [0, 1, 2] as const) {
      const meshes = batch.levels[detail]; let count = 0;
      for (const i of batch.indices) {
        if (details[i] !== detail) continue;
        const site = resources.sites[i], tile = impostorTile(site, x, z);
        dummy.position.set(site.x, site.y, site.z); dummy.rotation.set(0, detail === 2 ? Math.atan2(x - site.x, z - site.z) : site.phase, 0); dummy.scale.set(site.spread / 3, site.height / 12, site.spread / 3); dummy.updateMatrix();
        color.setHSL(.1 + Math.sin(site.phase) * .025, .05 + (i % 4) * .025, .66 + (i % 5) * .025);
        for (const mesh of meshes) { mesh.setMatrixAt(count, dummy.matrix); mesh.setColorAt(count, color); }
        if (detail === 2) { const atlas = meshes[0].geometry.getAttribute('instanceAtlas') as THREE.InstancedBufferAttribute; atlas.setXY(count, (tile % 2) * .5, tile < 2 ? .5 : 0); atlas.needsUpdate = true; }
        count++;
      }
      for (const mesh of meshes) {
        mesh.count = count; mesh.visible = count > 0; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        if (count) { mesh.computeBoundingSphere(); mesh.boundingSphere!.radius += .2; drawBatches++; triangleCount += count * ((mesh.geometry.index?.count ?? mesh.geometry.getAttribute('position').count) / 3); }
      }
    }
    resources.details = details; gl.shadowMap.needsUpdate = true;
    if (import.meta.env.DEV) { gl.domElement.dataset.forestTriangles = String(triangleCount); gl.domElement.dataset.forestBatches = String(drawBatches); gl.domElement.dataset.forestLods = [0, 1, 2].map(level => details.filter(d => d === level).length).join('/'); }
  });
  return <primitive object={resources.group} />;
}
