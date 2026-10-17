import { useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { forestSites } from './forestLayout';
import { impostorTile } from './treeModel';
export default function MobileForestTrees() {
  const source = useLoader(THREE.TextureLoader, `${import.meta.env.BASE_URL}textures/forest/tree-views.webp`);
  const r = useMemo(() => {
    const texture = source.clone(); texture.colorSpace = THREE.SRGBColorSpace; texture.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ map: texture, color: '#cdd3bc', alphaTest: .16, alphaToCoverage: true, side: THREE.DoubleSide });
    material.onBeforeCompile = shader => { shader.vertexShader = `attribute vec2 instanceAtlas;\n${shader.vertexShader}`.replace('#include <uv_vertex>', '#include <uv_vertex>\n vMapUv = vMapUv * .5 + instanceAtlas;'); };
    material.customProgramCacheKey = () => 'mobile-forest-atlas-v1';
    const sites = forestSites(), geometry = new THREE.PlaneGeometry(16, 16); geometry.translate(0, 16 * (490 / 512 - .5), 0);
    geometry.setAttribute('instanceAtlas', new THREE.InstancedBufferAttribute(new Float32Array(sites.length * 2), 2));
    const mesh = new THREE.InstancedMesh(geometry, material, sites.length); mesh.name = 'mobile-baked-forest'; mesh.frustumCulled = false;
    return { texture, material, geometry, mesh, sites, elapsed: 1, x: Infinity, z: Infinity };
  }, [source]);
  useEffect(() => () => { r.mesh.dispose(); r.geometry.dispose(); r.material.dispose(); r.texture.dispose(); }, [r]);
  useFrame(({ camera, gl }, dt) => {
    r.elapsed += dt; const x = camera.position.x, z = camera.position.z + 20;
    if (r.elapsed < .35 || Math.hypot(x - r.x, z - r.z) < .6) return;
    r.elapsed = 0; r.x = x; r.z = z;
    const dummy = new THREE.Object3D(), atlas = r.geometry.getAttribute('instanceAtlas');
    r.sites.forEach((site, i) => { const tile = impostorTile(site, x, z); dummy.position.set(site.x, site.y, site.z); dummy.rotation.set(0, Math.atan2(x - site.x, z - site.z), 0); dummy.scale.set(site.spread / 3, site.height / 12, site.spread / 3); dummy.updateMatrix(); r.mesh.setMatrixAt(i, dummy.matrix); atlas.setXY(i, tile % 2 * .5, tile < 2 ? .5 : 0); });
    r.mesh.instanceMatrix.needsUpdate = true; atlas.needsUpdate = true;
    if (import.meta.env.DEV) { gl.domElement.dataset.forestTriangles = String(r.sites.length * 2); gl.domElement.dataset.forestBatches = '1'; gl.domElement.dataset.forestLods = `0/0/${r.sites.length}`; }
  });
  return <primitive object={r.mesh} />;
}
