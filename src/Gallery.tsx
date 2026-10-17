import { passageMix } from './audioConfig';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Exhibition, Memory } from './content';
import { usePrivateMedia } from './media';
import Room1 from './rooms/Room1';
import Room2 from './rooms/Room2';
import Transition from './rooms/Transition';
import { chapterAt, ROOM_CENTERS } from './rooms/layout';
import { ROOM1_FRAME_SLOTS } from './rooms/room1Config';
import { stepMovement, type CameraPose } from './controls/movement';
import type { StickVector } from './controls/joystick';
import RenderBudget from './RenderBudget';

type Props = { content: Exhibition; pose: RefObject<CameraPose>; stick: RefObject<StickVector>; entered: boolean; chapter: number; paused: boolean; reduced: boolean; candleOut: boolean; lookReset: number; onChapter: (i: number) => void; onAudioMix: (mix: number) => void; onMemory: (m: Memory) => void; onError: (reason?: string) => void };

function Block({ position, size, color, metalness = 0 }: { position: [number, number, number]; size: [number, number, number]; color: string; metalness?: number }) {
  return <mesh position={position}><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.75} metalness={metalness} /></mesh>;
}
function textTexture(text: string, sub: string, color: string, dark = false) {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 768;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = dark ? '#243638' : '#e6dfd1'; ctx.fillRect(0, 0, 1024, 768);
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(48, 48, 928, 672);
  ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(512, 340, 126, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.font = 'italic 88px Georgia'; ctx.fillText(text, 512, 370, 850);
  ctx.font = '20px sans-serif'; ctx.fillText(sub, 512, 574, 830);
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function Frame({ memory, number, color, position, rotation, enabled, onMemory }: { memory: Memory; number: number; color: string; position: [number, number, number]; rotation: number; enabled: boolean; onMemory: Props['onMemory'] }) {
  const [hovered, setHovered] = useState(false);
  const plaque = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 144;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#ece6d5'; ctx.fillRect(0, 0, 768, 144);
    ctx.fillStyle = '#4c493e'; ctx.textAlign = 'center'; ctx.font = '28px "Noto Sans Thai", sans-serif'; ctx.fillText(memory.title, 384, 62, 710);
    ctx.font = '16px sans-serif'; ctx.fillText(memory.date, 384, 104, 710);
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [memory.title, memory.date]);
  useEffect(() => () => plaque.dispose(), [plaque]);
  const fallback = useMemo(() => textTexture(String(number).padStart(2, '0'), memory.kind === 'video' ? 'A MOMENT IN MOTION' : 'A MEMORY BELONGS HERE', color), [number, memory.kind, color]);
  useEffect(() => () => fallback.dispose(), [fallback]);
  const mediaPath = memory.kind === 'photo' ? memory.path : memory.posterPath;
  const { url } = usePrivateMedia(mediaPath, enabled);
  const imageUrl = url || (!mediaPath ? `${import.meta.env.BASE_URL}images/${number % 2 ? 'memory-coast' : 'memory-meadow'}.png` : undefined);
  const [photo, setPhoto] = useState<THREE.Texture>();
  useEffect(() => {
    setPhoto(undefined); if (!imageUrl) return;
    let active = true; let texture: THREE.Texture | undefined;
    new THREE.TextureLoader().load(imageUrl, t => {
      texture = t; t.colorSpace = THREE.SRGBColorSpace;
      // Preserve the photograph's aspect ratio with a crop in the frame; the modal shows the full image.
      const aspect = t.image.width / t.image.height;
      if (aspect > 3 / 4) { t.repeat.x = (3 / 4) / aspect; t.offset.x = (1 - t.repeat.x) / 2; }
      else { t.repeat.y = aspect / (3 / 4); t.offset.y = (1 - t.repeat.y) / 2; }
      if (active) setPhoto(t); else t.dispose();
    });
    return () => { active = false; texture?.dispose(); };
  }, [imageUrl]);
  return <group position={position} rotation={[0, rotation, 0]}>
    <Block position={[0, 0, -0.04]} size={[2.38, 3.08, 0.14]} color="#493a27" metalness={0.3} />
    <Block position={[0, 0, 0.045]} size={[2.28, 2.98, 0.04]} color="#bb9b61" metalness={0.65} />
    <Block position={[0, 0, 0.068]} size={[2.16, 2.86, 0.025]} color="#e2d6bc" />
    <mesh position={[0, 0, 0.092]} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (enabled && e.delta < 6) onMemory(memory); }}>
      <planeGeometry args={[2.04, 2.72]} /><meshStandardMaterial map={photo || fallback} roughness={0.8} emissive="#bda36a" emissiveIntensity={hovered && enabled ? .12 : .015} />
    </mesh>
    <mesh position={[0, -1.8, .055]}><planeGeometry args={[1.2, .225]} /><meshStandardMaterial map={plaque} roughness={1} /></mesh>
    <Block position={[0, 1.8, 0.16]} size={[.95, 0.045, 0.2]} color="#aa915b" metalness={0.7} />
    <pointLight position={[0, 1.7, 0.7]} color="#ffe2b0" intensity={2.5} distance={3.5} />
  </group>;
}
function Navigation(props: Props) {
  const { camera, gl } = useThree();
  const yaw = useRef(props.pose.current.yaw), pitch = useRef(props.pose.current.pitch);
  const lastChapter = useRef(chapterAt(props.pose.current.z));
  const callbacks = useRef(props); callbacks.current = props;
  const lastLookReset = useRef(props.lookReset);
  useEffect(() => {
    if (lastLookReset.current !== props.lookReset) { yaw.current = 0; pitch.current = -.055; lastLookReset.current = props.lookReset; }
  }, [props.lookReset]);
  useEffect(() => {
    const pose = props.pose.current;
    camera.position.set(props.entered ? pose.x : 0, props.entered ? 1.72 : 2, props.entered ? pose.z : 7.6);
    yaw.current = props.entered ? pose.yaw : 0; pitch.current = props.entered ? pose.pitch : -.07;
    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ');
    if (camera instanceof THREE.PerspectiveCamera) { camera.far = 480; camera.updateProjectionMatrix(); }
    lastChapter.current = chapterAt(pose.z);
  }, [camera, props.entered, props.pose]);
  useEffect(() => {
    let pointer: number | null = null, x = 0, y = 0;
    const down = (e: PointerEvent) => {
      if (!callbacks.current.entered || callbacks.current.paused || pointer !== null) return;
      pointer = e.pointerId; x = e.clientX; y = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer || callbacks.current.paused) return;
      yaw.current -= (e.clientX - x) * .003;
      pitch.current = THREE.MathUtils.clamp(pitch.current - (e.clientY - y) * .003, -.55, .55);
      x = e.clientX; y = e.clientY;
    };
    const up = (e: PointerEvent) => { if (pointer === e.pointerId) pointer = null; };
    const blur = () => { pointer = null; callbacks.current.stick.current = { x: 0, y: 0 }; };
    gl.domElement.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up); window.addEventListener('blur', blur);
    return () => {
      gl.domElement.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up); window.removeEventListener('blur', blur);
    };
  }, [camera, gl]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, .05);
    camera.rotation.y = props.reduced ? yaw.current : THREE.MathUtils.damp(camera.rotation.y, yaw.current, 7, dt);
    camera.rotation.x = props.reduced ? pitch.current : THREE.MathUtils.damp(camera.rotation.x, pitch.current, 7, dt);
    if (props.entered) {
      const next = stepMovement(camera.position, props.stick.current, camera.rotation.y, delta, !props.paused);
      camera.position.set(next.x, 1.72, next.z);
      props.pose.current = { ...next, yaw: camera.rotation.y, pitch: camera.rotation.x };
      props.onAudioMix(passageMix(next.z));
      const current = chapterAt(next.z);
      if (current !== lastChapter.current) { lastChapter.current = current; props.onChapter(current); }
    }
    if (import.meta.env.DEV) {
      gl.domElement.dataset.cameraX = camera.position.x.toFixed(4);
      gl.domElement.dataset.cameraZ = camera.position.z.toFixed(4);
      gl.domElement.dataset.cameraYaw = camera.rotation.y.toFixed(4);
      gl.domElement.dataset.frameMs = (delta * 1000).toFixed(1);
      gl.domElement.dataset.drawCalls = String(gl.info.render.calls);
      if (camera instanceof THREE.PerspectiveCamera) gl.domElement.dataset.cameraFar = String(camera.far);
    }
  });
  return null;
}
function SurfaceReflections() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl), room = new RoomEnvironment();
    const target = generator.fromScene(room, .04), previous = scene.environment, intensity = scene.environmentIntensity;
    scene.environment = target.texture; scene.environmentIntensity = .24;
    room.dispose(); generator.dispose();
    return () => { if (scene.environment === target.texture) { scene.environment = previous; scene.environmentIntensity = intensity; } target.dispose(); };
  }, [gl, scene]);
  return null;
}
function Scene(props: Props) {
  return <>
    <ContextEvents onError={props.onError} />
    <RenderBudget active={props.entered && !props.paused} />
    <SurfaceReflections />
    <color attach="background" args={['#aebbb5']} /><fog attach="fog" args={['#a3b2aa', 45, 280]} />
    <ambientLight intensity={0.4} /><hemisphereLight args={['#f4e7cf', '#534d3b', .85]} />
    <directionalLight position={[3, 8, 6]} intensity={1.4} color="#ffdfaf" />
    {ROOM_CENTERS.map((z, i) => {
      const frames = ROOM1_FRAME_SLOTS.map((slot, j) => {
        const memory = props.content.chapters[i].memories[j];
        if (!memory || i === 1) return null;
        return <group key={memory.id} position={slot.position} rotation={[0, slot.rotation, 0]} scale={slot.scale}><Frame memory={memory} number={j + 1} color="#a38b5c" position={[0, 0, 0]} rotation={0} enabled={props.entered && Math.abs(props.chapter - i) <= 1} onMemory={props.onMemory} /></group>;
      });
      return <group key={i} position={[0, 0, z]}>
        {i === 0 ? <Room1>{frames}</Room1> : <Room2 reduced={props.reduced} out={props.candleOut} decorationPath={props.entered ? props.content.cakeDecorationPath : undefined} />}
      </group>;
    })}
    {[0].map(i => <Transition key={i} z={-10 - i * 20} />)}
    <Navigation {...props} />
  </>;
}
function ContextEvents({ onError }: { onError: (reason?: string) => void }) {
  const gl = useThree(state => state.gl);
  useEffect(() => {
    let active = true;
    const lost = (event: Event) => { event.preventDefault(); if (active && gl.domElement.isConnected) onError('WebGL context lost'); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => { active = false; gl.domElement.removeEventListener('webglcontextlost', lost); };
  }, [gl, onError]);
  return null;
}
export default function Gallery(props: Props) {
  const [initialPose] = useState(() => ({ ...props.pose.current }));
  const cameraOptions = useMemo(() => ({ position: [props.entered ? initialPose.x : 0, props.entered ? 1.72 : 2, props.entered ? initialPose.z : 7.6] as [number, number, number], rotation: [initialPose.pitch, initialPose.yaw, 0] as [number, number, number], fov: 62, near: .1, far: 480 }), [initialPose]);
  return <Canvas shadows frameloop={props.entered && !props.paused ? 'always' : 'demand'} dpr={[1, 1.5]} camera={cameraOptions} gl={{ antialias: true, powerPreference: 'high-performance' }} fallback={<div className="canvas-fallback">เบราว์เซอร์นี้ไม่รองรับฉาก 3D กรุณาเลือกดูแบบอัลบั้ม</div>}><Scene {...props} /></Canvas>;
}
