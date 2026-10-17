import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AdaptiveResolution, renderBudget } from './rendering';

export default function RenderBudget({ active }: { active: boolean }) {
  const { gl, camera, size, setDpr } = useThree();
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const profile = useMemo(() => renderBudget(size.width, size.height, window.devicePixelRatio, coarse), [size.width, size.height, coarse]);
  const controller = useMemo(() => new AdaptiveResolution(profile.dpr), [profile.dpr]);
  const frames = useRef(0), geometryCount = useRef(-1);
  useEffect(() => {
    setDpr(profile.dpr); gl.transmissionResolutionScale = profile.transmissionScale; gl.shadowMap.enabled = !profile.compact;
    if (camera instanceof THREE.PerspectiveCamera) { camera.fov = profile.fov; camera.updateProjectionMatrix(); }
  }, [camera, gl, profile, setDpr]);
  useEffect(() => {
    gl.shadowMap.autoUpdate = true; gl.shadowMap.needsUpdate = true; frames.current = 0;
    return () => { gl.shadowMap.autoUpdate = true; };
  }, [gl]);
  useFrame((_, delta) => {
    const dpr = controller.sample(delta, active && !document.hidden);
    if (dpr !== undefined) setDpr(dpr);
    // The architecture and sunlight are static. Recompute when geometry loads or disappears.
    if (++frames.current > 12) gl.shadowMap.autoUpdate = false;
    if (geometryCount.current !== gl.info.memory.geometries) { geometryCount.current = gl.info.memory.geometries; gl.shadowMap.needsUpdate = true; }
    if (import.meta.env.DEV) {
      gl.domElement.dataset.renderDpr = gl.getPixelRatio().toFixed(3);
      gl.domElement.dataset.renderProfile = profile.compact ? 'touch' : 'desktop';
    }
  });
  return null;
}
